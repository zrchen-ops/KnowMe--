import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { nodePosition } from '@/services/graph/layout';
import type {
  ChatMessage,
  Entity,
  EntityType,
  EventCategory,
  Goal,
  LearningEvent,
  Memory,
  MemoryPayload,
  MemoryType,
  Relation,
  Task,
} from '@/types';
import type { MemoryDraft } from '@/services/ai/types';
import { formatDuration, nowISO } from '@/utils/date';
import { uid } from '@/utils/id';
import { createSeedData } from './seed';

export type ToastTone = 'success' | 'info' | 'error';

export interface ToastState {
  id: string;
  message: string;
  tone: ToastTone;
}

interface DataState {
  memories: Memory[];
  entities: Entity[];
  relations: Relation[];
  goals: Goal[];
  tasks: Task[];
  events: LearningEvent[];
  messages: ChatMessage[];
  settings: { autoConfirmMemories: boolean; displayName: string };
}

interface AppActions {
  hydrated: boolean;
  typing: boolean;
  toast: ToastState | null;
  setHydrated: (value: boolean) => void;
  setTyping: (value: boolean) => void;
  showToast: (message: string, tone?: ToastTone) => void;
  dismissToast: () => void;
  appendMessage: (message: ChatMessage) => void;
  addPendingMemory: (draft: MemoryDraft) => string;
  confirmMemory: (id: string) => void;
  rejectMemory: (id: string) => void;
  updateMemory: (id: string, patch: { content: string; entityName?: string; description?: string }) => void;
  deleteMemory: (id: string) => void;
  addGoal: (input: {
    title: string;
    description: string;
    deadline: string;
    progress?: number;
    milestones?: string[];
  }) => string;
  updateGoal: (id: string, patch: Partial<Pick<Goal, 'title' | 'description' | 'deadline' | 'progress' | 'status'>>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  addMilestone: (goalId: string, title: string) => void;
  deleteMilestone: (goalId: string, milestoneId: string) => void;
  addTask: (input: {
    title: string;
    date: string;
    startTime?: string;
    duration: number;
    goalId?: string;
    allDay?: boolean;
  }) => string;
  updateTask: (id: string, patch: Partial<Pick<Task, 'title' | 'date' | 'startTime' | 'duration' | 'goalId' | 'allDay'>>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addEntity: (input: {
    name: string;
    type: EntityType;
    description: string;
    relationType: string;
  }) => string;
  updateEntity: (id: string, patch: Partial<Pick<Entity, 'name' | 'type' | 'description'>> & { relationType?: string }) => void;
  deleteEntity: (id: string) => void;
  updateSettings: (patch: Partial<DataState['settings']>) => void;
  resetData: () => void;
}

export type AppStore = DataState & AppActions;

type ApplyResult = {
  entities: Entity[];
  relations: Relation[];
  goals: Goal[];
  tasks: Task[];
  events: LearningEvent[];
  goalId?: string;
  taskId?: string;
  created: boolean;
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function selfEntityId(entities: Entity[]): string {
  return entities.find((entity) => entity.type === 'self')?.id ?? 'e-self';
}

function normalizeGoalTitle(title: string): string {
  return title.replace(/通过|坚持|完成|拿到|获得|学会|考取/g, '').replace(/目标|计划/g, '');
}

function findGoalByTitle(goals: Goal[], title?: string): Goal | undefined {
  if (!title) return undefined;
  const key = normalizeGoalTitle(title);
  return goals
    .filter((goal) => goal.status === 'active')
    .find((goal) => {
      const goalKey = normalizeGoalTitle(goal.title);
      return goalKey.length > 1 && (key.includes(goalKey) || goalKey.includes(key));
    });
}

function categoryForTask(task: Task): EventCategory {
  if (/健身|跑步|篮球|运动|训练/.test(task.title)) return 'fitness';
  if (/实习|简历|面试|求职/.test(task.title)) return 'career';
  return 'study';
}

function entityTypeForMemory(type: MemoryType): EntityType {
  if (type === 'goal') return 'goal';
  if (type === 'task') return 'plan';
  if (type === 'event') return 'event';
  if (type === 'interest') return 'interest';
  if (type === 'person') return 'person';
  if (type === 'plan') return 'plan';
  return 'plan';
}

function applyMemory(memory: Memory, state: DataState): ApplyResult {
  const now = nowISO();
  const payload = memory.payload;
  const entities = [...state.entities];
  const relations = [...state.relations];
  const goals = [...state.goals];
  const tasks = [...state.tasks];
  const events = [...state.events];
  let goalId: string | undefined;
  let taskId: string | undefined;
  let entityId: string | undefined;
  let created = false;

  if (payload?.entityName) {
    const entityType = payload.entityType ?? entityTypeForMemory(memory.type);
    const existing = entities.find(
      (entity) => entity.name === payload.entityName && entity.type === entityType,
    );
    if (existing) {
      entityId = existing.id;
    } else {
      const entity: Entity = {
        id: uid('e'),
        name: payload.entityName,
        type: entityType,
        description: payload.description ?? memory.content,
        confirmed: true,
        sourceMemoryId: memory.id,
        position: nodePosition(entities, entities.length),
        createdAt: now,
        updatedAt: now,
      };
      entities.push(entity);
      entityId = entity.id;
      created = true;
    }
  }

  if (payload?.goal) {
    const existingGoa = goals.find((goal) => goal.sourceMemoryId === memory.id);
    if (existingGoa) {
      goalId = existingGoa.id;
    } else {
      const goal: Goal = {
        id: uid('g'),
        title: payload.goal.title,
        description: payload.goal.description,
        deadline: payload.goal.deadline,
        progress: payload.goal.progress ?? 0,
        status: 'active',
        milestones: (payload.goal.milestones ?? []).map((title) => ({
          id: uid('ms'),
          title,
          done: false,
        })),
        sourceMemoryId: memory.id,
        createdAt: now,
        updatedAt: now,
      };
      goals.push(goal);
      goalId = goal.id;
      created = true;
    }
  }

  if (entityId) {
    const index = entities.findIndex((entity) => entity.id === entityId);
    if (index >= 0 && goalId) {
      entities[index] = { ...entities[index], goalId, updatedAt: now };
    }
    const selfId = selfEntityId(entities);
    if (entityId !== selfId) {
      const relationExists = relations.some(
        (relation) => relation.sourceId === selfId && relation.targetId === entityId,
      );
      if (!relationExists) {
        relations.push({
          id: uid('r'),
          sourceId: selfId,
          targetId: entityId,
          relationType: payload?.relationType ?? '关联',
          confidence: memory.confidence,
        });
        created = true;
      }
    }
  }

  if (payload?.task) {
    const existingTask = tasks.find((task) => task.sourceMemoryId === memory.id);
    if (existingTask) {
      taskId = existingTask.id;
    } else {
      const goal = findGoalByTitle(goals, payload.task.goalTitle);
      const task: Task = {
        id: uid('t'),
        title: payload.task.title,
        date: payload.task.date,
        startTime: payload.task.startTime,
        duration: payload.task.duration,
        status: 'todo',
        allDay: payload.task.allDay,
        goalId: goal?.id,
        entityId,
        source: 'agent',
        sourceMemoryId: memory.id,
        createdAt: now,
        updatedAt: now,
      };
      tasks.push(task);
      taskId = task.id;
      created = true;
    }
  }

  if (payload?.event) {
    const goal =
      findGoalByTitle(goals, payload.goalTitle) ?? findGoalByTitle(goals, payload.event.title);
    const event: LearningEvent = {
      id: uid('ev'),
      title: payload.event.title,
      category: payload.event.category,
      duration: payload.event.duration,
      date: payload.event.date,
      source: memory.source,
      goalId: goal?.id,
      sourceMemoryId: memory.id,
      createdAt: now,
    };
    events.push(event);
    created = true;

    if (goal && payload.event.duration >= 1) {
      const index = goals.findIndex((item) => item.id === goal.id);
      if (index >= 0) {
        goals[index] = {
          ...goals[index],
          progress: Math.min(100, goals[index].progress + 2),
          updatedAt: now,
        };
        goalId = goals[index].id;
      }
    }
  }

  return { entities, relations, goals, tasks, events, goalId, taskId, created };
}

const seed = createSeedData();

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...seed,
      hydrated: false,
      typing: false,
      toast: null,

      setHydrated: (value) => set({ hydrated: value }),
      setTyping: (value) => set({ typing: value }),

      showToast: (message, tone = 'success') => {
        if (toastTimer) clearTimeout(toastTimer);
        const toast: ToastState = { id: uid('toast'), message, tone };
        set({ toast });
        toastTimer = setTimeout(() => {
          set((state) => (state.toast?.id === toast.id ? { toast: null } : state));
        }, 2600);
      },
      dismissToast: () => {
        if (toastTimer) clearTimeout(toastTimer);
        set({ toast: null });
      },

      appendMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

      addPendingMemory: (draft: MemoryDraft) => {
        const now = nowISO();
        const memory: Memory = {
          id: uid('m'),
          content: draft.content,
          type: draft.type,
          source: draft.source,
          confidence: draft.confidence,
          status: 'pending',
          origin: draft.origin,
          payload: draft.payload,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ memories: [...state.memories, memory] }));
        return memory.id;
      },

      confirmMemory: (id) => {
        const state = get();
        const memory = state.memories.find((item) => item.id === id);
        if (!memory || memory.status === 'confirmed') return;
        const result = applyMemory(memory, state);
        const now = nowISO();
        set({
          memories: state.memories.map((item) =>
            item.id === id ? { ...item, status: 'confirmed', updatedAt: now } : item,
          ),
          entities: result.entities,
          relations: result.relations,
          goals: result.goals,
          tasks: result.tasks,
          events: result.events,
        });
        get().showToast(
          result.created ? '已保存记忆，并同步到图谱与成长' : '记忆已确认',
          'success',
        );
      },

      rejectMemory: (id) => {
        const now = nowISO();
        set((state) => ({
          memories: state.memories.map((memory) =>
            memory.id === id ? { ...memory, status: 'rejected', updatedAt: now } : memory,
          ),
        }));
        get().showToast('已忽略这条记忆', 'info');
      },

      updateMemory: (id, patch) => {
        const state = get();
        const memory = state.memories.find((item) => item.id === id);
        if (!memory) return;
        const now = nowISO();
        const payload: MemoryPayload | undefined = memory.payload
          ? {
              ...memory.payload,
              entityName: patch.entityName ?? memory.payload.entityName,
              description: patch.description ?? memory.payload.description,
              goal: memory.payload.goal
                ? {
                    ...memory.payload.goal,
                    title: patch.entityName ?? memory.payload.goal.title,
                    description: patch.description ?? memory.payload.goal.description,
                  }
                : undefined,
              task: memory.payload.task
                ? {
                    ...memory.payload.task,
                    title: patch.entityName ?? memory.payload.task.title,
                  }
                : undefined,
              event: memory.payload.event
                ? {
                    ...memory.payload.event,
                    title: patch.entityName ?? memory.payload.event.title,
                  }
                : undefined,
            }
          : undefined;

        const entity = state.entities.find((item) => item.sourceMemoryId === id);
        const goal = state.goals.find((item) => item.sourceMemoryId === id);
        const task = state.tasks.find((item) => item.sourceMemoryId === id);
        set({
          memories: state.memories.map((item) =>
            item.id === id ? { ...item, content: patch.content, payload, updatedAt: now } : item,
          ),
          entities: entity
            ? state.entities.map((item) =>
                item.id === entity.id
                  ? {
                      ...item,
                      name: patch.entityName ?? item.name,
                      description: patch.description ?? item.description,
                      updatedAt: now,
                    }
                  : item,
              )
            : state.entities,
          goals: goal
            ? state.goals.map((item) =>
                item.id === goal.id
                  ? {
                      ...item,
                      title: patch.entityName ?? item.title,
                      description: patch.description ?? item.description,
                      updatedAt: now,
                    }
                  : item,
              )
            : state.goals,
          tasks: task
            ? state.tasks.map((item) =>
                item.id === task.id
                  ? { ...item, title: patch.entityName ?? item.title, updatedAt: now }
                  : item,
              )
            : state.tasks,
        });
        get().showToast('记忆已更新', 'success');
      },

      deleteMemory: (id) => {
        const state = get();
        const entityIds = new Set(
          state.entities
            .filter((entity) => entity.sourceMemoryId === id)
            .map((entity) => entity.id),
        );
        const goalsWithMemory = state.goals.filter((goal) => goal.sourceMemoryId === id);
        goalsWithMemory.forEach((goal) => {
          state.entities
            .filter((entity) => entity.goalId === goal.id)
            .forEach((entity) => entityIds.add(entity.id));
        });
        set({
          memories: state.memories.filter((memory) => memory.id !== id),
          entities: state.entities.filter((entity) => !entityIds.has(entity.id)),
          relations: state.relations.filter(
            (relation) =>
              !entityIds.has(relation.sourceId) && !entityIds.has(relation.targetId),
          ),
          goals: state.goals.filter((goal) => goal.sourceMemoryId !== id),
          tasks: state.tasks
            .filter((task) => task.sourceMemoryId !== id)
            .map((task) =>
              task.entityId && entityIds.has(task.entityId)
                ? { ...task, entityId: undefined }
                : task,
            ),
          events: state.events.filter((event) => event.sourceMemoryId !== id),
        });
        get().showToast('记忆及关联内容已删除', 'info');
      },

      addGoal: (input) => {
        const state = get();
        const now = nowISO();
        const goalId = uid('g');
        const memoryId = uid('m');
        const entityId = uid('e');
        const selfId = selfEntityId(state.entities);
        const memory: Memory = {
          id: memoryId,
          content: `我想${input.title}。${input.description}`,
          type: 'goal',
          source: '用户 · 目标管理',
          confidence: 1,
          status: 'confirmed',
          origin: 'user',
          createdAt: now,
          updatedAt: now,
          payload: {
            entityName: input.title,
            entityType: 'goal',
            relationType: '拥有目标',
            description: input.description,
            goal: {
              title: input.title,
              description: input.description,
              deadline: input.deadline,
              progress: input.progress ?? 0,
              milestones: input.milestones,
            },
          },
        };
        const goal: Goal = {
          id: goalId,
          title: input.title,
          description: input.description,
          deadline: input.deadline,
          progress: Math.max(0, Math.min(100, input.progress ?? 0)),
          status: 'active',
          milestones: (input.milestones ?? []).map((title) => ({
            id: uid('ms'),
            title,
            done: false,
          })),
          sourceMemoryId: memoryId,
          createdAt: now,
          updatedAt: now,
        };
        const entity: Entity = {
          id: entityId,
          name: input.title,
          type: 'goal',
          description: input.description,
          confirmed: true,
          goalId,
          sourceMemoryId: memoryId,
          position: nodePosition(state.entities, state.entities.length),
          createdAt: now,
          updatedAt: now,
        };
        set({
          goals: [...state.goals, goal],
          memories: [...state.memories, memory],
          entities: [...state.entities, entity],
          relations: [
            ...state.relations,
            {
              id: uid('r'),
              sourceId: selfId,
              targetId: entityId,
              relationType: '拥有目标',
              confidence: 1,
            },
          ],
        });
        get().showToast('目标已创建，并同步到图谱', 'success');
        return goalId;
      },

      updateGoal: (id, patch) => {
        const state = get();
        const now = nowISO();
        const goal = state.goals.find((item) => item.id === id);
        set({
          goals: state.goals.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...patch,
                  progress:
                    patch.progress !== undefined
                      ? Math.max(0, Math.min(100, patch.progress))
                      : item.progress,
                  updatedAt: now,
                }
              : item,
          ),
          entities: goal
            ? state.entities.map((entity) =>
                entity.goalId === id
                  ? {
                      ...entity,
                      name: patch.title ?? entity.name,
                      description: patch.description ?? entity.description,
                      updatedAt: now,
                    }
                  : entity,
              )
            : state.entities,
        });
      },

      deleteGoal: (id) => {
        const state = get();
        const entityIds = new Set(
          state.entities.filter((entity) => entity.goalId === id).map((entity) => entity.id),
        );
        set({
          goals: state.goals.filter((goal) => goal.id !== id),
          entities: state.entities.filter((entity) => entity.goalId !== id),
          relations: state.relations.filter(
            (relation) =>
              !entityIds.has(relation.sourceId) && !entityIds.has(relation.targetId),
          ),
          tasks: state.tasks.map((task) =>
            task.goalId === id ? { ...task, goalId: undefined } : task,
          ),
          events: state.events.map((event) =>
            event.goalId === id ? { ...event, goalId: undefined } : event,
          ),
        });
        get().showToast('目标与图谱节点已删除', 'info');
      },

      toggleMilestone: (goalId, milestoneId) => {
        const now = nowISO();
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  milestones: goal.milestones.map((milestone) =>
                    milestone.id === milestoneId
                      ? { ...milestone, done: !milestone.done }
                      : milestone,
                  ),
                  updatedAt: now,
                }
              : goal,
          ),
        }));
      },

      addMilestone: (goalId, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        const now = nowISO();
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  milestones: [...goal.milestones, { id: uid('ms'), title: trimmed, done: false }],
                  updatedAt: now,
                }
              : goal,
          ),
        }));
      },

      deleteMilestone: (goalId, milestoneId) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  milestones: goal.milestones.filter((milestone) => milestone.id !== milestoneId),
                }
              : goal,
          ),
        }));
      },

      addTask: (input) => {
        const state = get();
        const now = nowISO();
        const taskId = uid('t');
        const memoryId = uid('m');
        const entityId = uid('e');
        const selfId = selfEntityId(state.entities);
        const memory: Memory = {
          id: memoryId,
          content: `我安排了「${input.title}」。`,
          type: 'task',
          source: '用户 · 日程管理',
          confidence: 1,
          status: 'confirmed',
          origin: 'user',
          createdAt: now,
          updatedAt: now,
          payload: {
            entityName: input.title,
            entityType: 'plan',
            relationType: '计划',
            description: `${input.date} · ${formatDuration(input.duration)}`,
            task: {
              title: input.title,
              date: input.date,
              startTime: input.startTime,
              duration: input.duration,
              allDay: input.allDay,
            },
            taskId,
          },
        };
        const task: Task = {
          id: taskId,
          title: input.title,
          date: input.date,
          startTime: input.startTime,
          duration: input.duration,
          status: 'todo',
          allDay: input.allDay,
          goalId: input.goalId,
          entityId,
          source: 'user',
          sourceMemoryId: memoryId,
          createdAt: now,
          updatedAt: now,
        };
        const entity: Entity = {
          id: entityId,
          name: input.title,
          type: 'plan',
          description: memory.payload?.description ?? '',
          confirmed: true,
          sourceMemoryId: memoryId,
          position: nodePosition(state.entities, state.entities.length),
          createdAt: now,
          updatedAt: now,
        };
        set({
          tasks: [...state.tasks, task],
          memories: [...state.memories, memory],
          entities: [...state.entities, entity],
          relations: [
            ...state.relations,
            {
              id: uid('r'),
              sourceId: selfId,
              targetId: entityId,
              relationType: '计划',
              confidence: 1,
            },
          ],
        });
        get().showToast('日程已添加，并同步到图谱', 'success');
        return taskId;
      },

      updateTask: (id, patch) => {
        const state = get();
        const now = nowISO();
        const prev = state.tasks.find((task) => task.id === id);
        set({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...patch, updatedAt: now } : task,
          ),
          entities:
            prev?.entityId && patch.title
              ? state.entities.map((entity) =>
                  entity.id === prev.entityId
                    ? { ...entity, name: patch.title ?? entity.name, updatedAt: now }
                    : entity,
                )
              : state.entities,
          memories: prev
            ? state.memories.map((memory) =>
                memory.payload?.taskId === id
                  ? {
                      ...memory,
                      content: patch.title ? `我安排了「${patch.title}」。` : memory.content,
                      payload: memory.payload
                        ? {
                            ...memory.payload,
                            entityName: patch.title ?? memory.payload.entityName,
                            task: memory.payload.task
                              ? {
                                  ...memory.payload.task,
                                  title: patch.title ?? memory.payload.task.title,
                                  date: patch.date ?? memory.payload.task.date,
                                  duration: patch.duration ?? memory.payload.task.duration,
                                }
                              : undefined,
                          }
                        : undefined,
                    }
                  : memory,
              )
            : state.memories,
        });
      },

      toggleTask: (id) => {
        const state = get();
        const task = state.tasks.find((item) => item.id === id);
        if (!task) return;
        const now = nowISO();
        const nextStatus = task.status === 'done' ? 'todo' : 'done';
        const goals = [...state.goals];
        let events = [...state.events];
        let memories = [...state.memories];

        if (nextStatus === 'done') {
          if (!events.some((event) => event.taskId === id)) {
            events = [
              ...events,
              {
                id: uid('ev'),
                title: task.title,
                category: categoryForTask(task),
                duration: task.duration,
                date: task.date,
                source: '成长 · 任务完成',
                taskId: id,
                goalId: task.goalId,
                createdAt: now,
              },
            ];
          }
          memories = [
            ...memories,
            {
              id: uid('m'),
              content: `完成了任务「${task.title}」，用时 ${formatDuration(task.duration)}。`,
              type: 'event',
              source: '成长 · 任务完成',
              confidence: 1,
              status: 'confirmed',
              origin: 'user',
              createdAt: now,
              updatedAt: now,
              payload: { taskId: id },
            },
          ];
          if (task.goalId) {
            const index = goals.findIndex((goal) => goal.id === task.goalId);
            if (index >= 0) {
              goals[index] = {
                ...goals[index],
                progress: Math.min(100, goals[index].progress + 2),
                updatedAt: now,
              };
            }
          }
        } else {
          events = events.filter((event) => event.taskId !== id);
          memories = memories.filter(
            (memory) => !(memory.payload?.taskId === id && memory.source === '成长 · 任务完成'),
          );
          if (task.goalId) {
            const index = goals.findIndex((goal) => goal.id === task.goalId);
            if (index >= 0) {
              goals[index] = {
                ...goals[index],
                progress: Math.max(0, goals[index].progress - 2),
                updatedAt: now,
              };
            }
          }
        }

        set({
          tasks: state.tasks.map((item) =>
            item.id === id ? { ...item, status: nextStatus, updatedAt: now } : item,
          ),
          events,
          memories,
          goals,
        });
        if (nextStatus === 'done') {
          get().showToast('完成啦，成长记录已更新', 'success');
        }
      },

      deleteTask: (id) => {
        const state = get();
        const task = state.tasks.find((item) => item.id === id);
        const entityIds = new Set<string>();
        if (task?.entityId) entityIds.add(task.entityId);
        state.entities
          .filter((entity) => state.memories.some((memory) => memory.payload?.taskId === id && memory.id === entity.sourceMemoryId))
          .forEach((entity) => entityIds.add(entity.id));
        set({
          tasks: state.tasks.filter((item) => item.id !== id),
          events: state.events.filter((event) => event.taskId !== id),
          memories: state.memories.filter((memory) => memory.payload?.taskId !== id),
          entities: state.entities.filter((entity) => !entityIds.has(entity.id)),
          relations: state.relations.filter(
            (relation) =>
              !entityIds.has(relation.sourceId) && !entityIds.has(relation.targetId),
          ),
        });
        get().showToast('日程已删除，相关记录已移除', 'info');
      },

      addEntity: (input) => {
        const state = get();
        const now = nowISO();
        const entityId = uid('e');
        const memoryId = uid('m');
        const selfId = selfEntityId(state.entities);
        const entity: Entity = {
          id: entityId,
          name: input.name,
          type: input.type,
          description: input.description,
          confirmed: true,
          sourceMemoryId: memoryId,
          position: nodePosition(state.entities, state.entities.length),
          createdAt: now,
          updatedAt: now,
        };
        const memory: Memory = {
          id: memoryId,
          content: `我补充了关于「${input.name}」的记忆：${input.description}`,
          type:
            input.type === 'goal'
              ? 'goal'
              : input.type === 'person'
                ? 'person'
                : input.type === 'interest'
                  ? 'interest'
                  : input.type === 'event'
                    ? 'event'
                    : 'plan',
          source: '用户 · 手动添加',
          confidence: 1,
          status: 'confirmed',
          origin: 'user',
          payload: {
            entityName: input.name,
            entityType: input.type,
            relationType: input.relationType,
            description: input.description,
          },
          createdAt: now,
          updatedAt: now,
        };
        set({
          entities: [...state.entities, entity],
          memories: [...state.memories, memory],
          relations: [
            ...state.relations,
            {
              id: uid('r'),
              sourceId: selfId,
              targetId: entityId,
              relationType: input.relationType,
              confidence: 1,
            },
          ],
        });
        get().showToast('已加入图谱', 'success');
        return entityId;
      },

      updateEntity: (id, patch) => {
        const state = get();
        const now = nowISO();
        const entity = state.entities.find((item) => item.id === id);
        if (!entity) return;
        set({
          entities: state.entities.map((item) =>
            item.id === id
              ? {
                  ...item,
                  name: patch.name ?? item.name,
                  type: patch.type ?? item.type,
                  description: patch.description ?? item.description,
                  updatedAt: now,
                }
              : item,
          ),
          goals: entity.goalId
            ? state.goals.map((goal) =>
                goal.id === entity.goalId
                  ? {
                      ...goal,
                      title: patch.name ?? goal.title,
                      description: patch.description ?? goal.description,
                      updatedAt: now,
                    }
                  : goal,
              )
            : state.goals,
          relations: patch.relationType
            ? state.relations.map((relation) =>
                relation.targetId === id
                  ? { ...relation, relationType: patch.relationType ?? relation.relationType }
                  : relation,
              )
            : state.relations,
          memories: state.memories.map((memory) =>
            memory.id === entity.sourceMemoryId
              ? {
                  ...memory,
                  content: `我补充了关于「${patch.name ?? entity.name}」的记忆：${
                    patch.description ?? entity.description
                  }`,
                  payload: memory.payload
                    ? {
                        ...memory.payload,
                        entityName: patch.name ?? memory.payload.entityName,
                        description: patch.description ?? memory.payload.description,
                        goal: memory.payload.goal
                          ? {
                              ...memory.payload.goal,
                              title: patch.name ?? memory.payload.goal.title,
                              description:
                                patch.description ?? memory.payload.goal.description,
                            }
                          : undefined,
                      }
                    : undefined,
                }
              : memory,
          ),
        });
        get().showToast('节点已更新', 'success');
      },

      deleteEntity: (id) => {
        const state = get();
        const entity = state.entities.find((item) => item.id === id);
        if (!entity || entity.type === 'self') return;
        const goalId = entity.goalId;
        const removedIds = new Set(
          state.entities
            .filter((item) => item.id === id || (goalId ? item.goalId === goalId : false))
            .map((item) => item.id),
        );
        set({
          entities: state.entities.filter((item) => !removedIds.has(item.id)),
          relations: state.relations.filter(
            (relation) =>
              !removedIds.has(relation.sourceId) && !removedIds.has(relation.targetId),
          ),
          goals: goalId ? state.goals.filter((goal) => goal.id !== goalId) : state.goals,
          tasks: goalId
            ? state.tasks.map((task) =>
                task.goalId === goalId ? { ...task, goalId: undefined } : task,
              )
            : state.tasks,
          memories: state.memories.filter((memory) => memory.id !== entity.sourceMemoryId),
        });
        get().showToast(goalId ? '节点与关联目标已删除' : '节点已删除', 'info');
      },

      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),

      resetData: () => {
        const fresh = createSeedData();
        set({ ...fresh, typing: false, toast: null });
        get().showToast('已恢复演示数据', 'info');
      },
    }),
    {
      name: 'knowme-storage-v2',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        memories: state.memories,
        entities: state.entities,
        relations: state.relations,
        goals: state.goals,
        tasks: state.tasks,
        events: state.events,
        messages: state.messages,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export type { MemoryDraft };
