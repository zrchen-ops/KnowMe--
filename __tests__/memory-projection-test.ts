import { useAppStore } from '@/store/useAppStore';
import type { MemoryDraft } from '@/store/useAppStore';
import { createEmptyData } from '@/store/seed';
import { computeGrowthStats } from '@/services/growth/stats';
import type { Entity, Goal, LearningEvent, Task } from '@/types';
import { addDaysISO, diffDays, parseISO, startOfWeekISO, todayISO } from '@/utils/date';

const SELF: Entity = {
  id: 'e-self',
  name: '我',
  type: 'self',
  description: '',
  confirmed: true,
  position: { x: 180, y: 270 },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

/** 每个用例从「空图谱 + 一个 self 节点」开始，不依赖种子数据。 */
function resetStore() {
  useAppStore.setState({
    memories: [],
    entities: [SELF],
    relations: [],
    goals: [],
    tasks: [],
    events: [],
    messages: [],
    settings: { autoConfirmMemories: false, displayName: '我', onboarded: true },
    typing: false,
    toast: null,
  });
}

const s = () => useAppStore.getState();

function goalDraft(title: string, deadline = '2027-01-20'): MemoryDraft {
  return {
    content: `我想${title}`,
    type: 'goal',
    confidence: 0.9,
    origin: 'user',
    source: '测试',
    payload: {
      entityName: title,
      entityType: 'goal',
      relationType: '拥有目标',
      description: title,
      goal: { title, description: title, deadline, progress: 0, milestones: [] },
    },
  };
}

function taskDraft(title: string, date: string, goalTitle?: string): MemoryDraft {
  return {
    content: `安排${title}`,
    type: 'task',
    confidence: 0.9,
    origin: 'user',
    source: '测试',
    payload: {
      entityName: title,
      entityType: 'plan',
      relationType: '计划',
      description: `${date} · 1h`,
      task: { title, date, duration: 1, goalTitle },
    },
  };
}

function eventDraft(title: string, hours: number, goalTitle?: string): MemoryDraft {
  return {
    content: `完成了${title}`,
    type: 'event',
    confidence: 0.95,
    origin: 'user',
    source: '测试',
    payload: {
      entityName: title,
      entityType: 'event',
      relationType: '记录',
      description: `今天完成 ${hours}h`,
      event: { title, category: 'study', duration: hours, date: todayISO() },
      goalTitle,
    },
  };
}

function confirm(draft: MemoryDraft): string {
  const id = s().addPendingMemory(draft);
  s().confirmMemory(id);
  return id;
}

beforeEach(resetStore);
// showToast 会挂一个 2.6s 的定时器；测试结束前清掉，避免 Jest 报「未退出」。
afterEach(() => s().dismissToast());

describe('记忆 -> 图谱/目标/任务/事件 投影', () => {
  test('确认一条目标记忆：生成目标、节点、从「我」出发的关系', () => {
    const memoryId = confirm(goalDraft('通过英语六级'));

    expect(s().memories).toHaveLength(1);
    expect(s().memories[0].status).toBe('confirmed');
    expect(s().goals).toHaveLength(1);
    expect(s().goals[0].title).toBe('通过英语六级');

    const goalEntity = s().entities.find((e) => e.type === 'goal');
    expect(goalEntity).toBeDefined();
    expect(goalEntity?.sourceMemoryId).toBe(memoryId);
    expect(goalEntity?.goalId).toBe(s().goals[0].id);

    const relation = s().relations.find((r) => r.targetId === goalEntity?.id);
    expect(relation).toMatchObject({ sourceId: 'e-self', relationType: '拥有目标' });
  });

  test('重复确认同一条记忆不会重复投影（幂等）', () => {
    const memoryId = confirm(goalDraft('通过英语六级'));
    s().confirmMemory(memoryId);
    s().confirmMemory(memoryId);

    expect(s().goals).toHaveLength(1);
    expect(s().entities.filter((e) => e.type === 'goal')).toHaveLength(1);
    expect(s().relations).toHaveLength(1);
  });

  test('任务记忆：生成任务并挂到节点与目标上', () => {
    confirm(goalDraft('通过英语六级'));
    confirm(taskDraft('复习高数', '2026-11-07', '通过英语六级'));

    const task = s().tasks[0];
    expect(task).toMatchObject({ title: '复习高数', date: '2026-11-07', status: 'todo' });
    expect(task.goalId).toBe(s().goals[0].id);
    expect(task.entityId).toBeDefined();
    expect(s().entities.some((e) => e.id === task.entityId && e.type === 'plan')).toBe(true);
  });

  test('事件记忆：写入成长记录，并推进关联目标进度', () => {
    confirm(goalDraft('通过英语六级'));
    const before = s().goals[0].progress;

    confirm(eventDraft('高数复习', 2, '通过英语六级'));

    expect(s().events).toHaveLength(1);
    expect(s().events[0]).toMatchObject({ title: '高数复习', duration: 2, category: 'study' });
    expect(s().goals[0].progress).toBe(before + 2);
  });

  test('拒绝的记忆不会进入图谱', () => {
    const id = s().addPendingMemory(goalDraft('通过英语六级'));
    s().rejectMemory(id);

    expect(s().memories[0].status).toBe('rejected');
    expect(s().goals).toHaveLength(0);
    expect(s().entities).toHaveLength(1);
    expect(s().relations).toHaveLength(0);
  });

  test('删除记忆会级联清理任务、节点与关系', () => {
    const memoryId = confirm(taskDraft('复习高数', '2026-11-07'));
    const task = s().tasks[0];
    const entityId = task.entityId;

    s().deleteMemory(memoryId);

    expect(s().tasks).toHaveLength(0);
    expect(s().entities.some((e) => e.id === entityId)).toBe(false);
    expect(s().relations).toHaveLength(0);
  });

  test('任务完成：生成事件、写入记忆、目标 +2；取消后回滚', () => {
    confirm(goalDraft('通过英语六级'));
    confirm(taskDraft('复习高数', '2026-11-07', '通过英语六级'));
    const task = s().tasks[0];
    const progress = s().goals[0].progress;

    s().toggleTask(task.id);
    expect(s().tasks[0].status).toBe('done');
    expect(s().events.filter((e) => e.taskId === task.id)).toHaveLength(1);
    expect(s().memories.some((m) => m.payload?.taskId === task.id)).toBe(true);
    expect(s().goals[0].progress).toBe(progress + 2);

    s().toggleTask(task.id);
    expect(s().tasks[0].status).toBe('todo');
    expect(s().events.filter((e) => e.taskId === task.id)).toHaveLength(0);
    expect(s().goals[0].progress).toBe(progress);
  });

  test('同一目标的第二次表达会更新已有目标，不新建重复目标（P1-2）', () => {
    confirm(goalDraft('通过英语六级', '2027-01-20'));
    // 先用一次事件推进度，验证归并时进度不被清零
    confirm(eventDraft('高数复习', 2, '通过英语六级'));
    const progress = s().goals[0].progress;

    confirm(goalDraft('英语六级', '2027-03-01'));

    expect(s().goals).toHaveLength(1);
    expect(s().goals[0].deadline).toBe('2027-03-01');
    expect(s().goals[0].progress).toBe(progress);
    // 节点与关系也不能重复长出来
    const goalEntities = s().entities.filter((e) => e.type === 'goal');
    expect(goalEntities).toHaveLength(1);
    expect(s().relations.filter((r) => r.targetId === goalEntities[0].id)).toHaveLength(1);
  });

  test('删除目标会同时清理其来源记忆与节点（P1-3）', () => {
    const memoryId = confirm(goalDraft('通过英语六级'));
    s().deleteGoal(s().goals[0].id);

    expect(s().memories.some((m) => m.id === memoryId)).toBe(false);
    expect(s().entities.filter((e) => e.type === 'goal')).toHaveLength(0);
    expect(s().relations).toHaveLength(0);
  });

  test('clearAllData 清空用户数据，只留「我」这个中心节点（P1-4）', () => {
    confirm(goalDraft('通过英语六级'));
    s().clearAllData();

    expect(s().memories).toHaveLength(0);
    expect(s().goals).toHaveLength(0);
    expect(s().tasks).toHaveLength(0);
    expect(s().entities).toHaveLength(1);
    expect(s().entities[0].type).toBe('self');
    // 清空后要重新走一次引导
    expect(s().settings.onboarded).toBe(false);
  });

  test('loadDemoData 载入演示数据（显式选择才出现）', () => {
    s().loadDemoData();

    expect(s().goals.length).toBeGreaterThan(0);
    expect(s().entities.length).toBeGreaterThan(1);
    expect(s().tasks.length).toBeGreaterThan(0);
  });
});

describe('首次引导与下周计划', () => {
  test('completeOnboarding 写入称呼、关注与第一个目标，并标记已完成', () => {
    s().completeOnboarding({
      displayName: '小林',
      focus: '准备英语六级',
      goalTitle: '三个月内找到 Agent 实习',
    });

    expect(s().settings).toMatchObject({ displayName: '小林', onboarded: true });
    const types = s().memories.map((m) => m.type).sort();
    expect(types).toEqual(['goal', 'interest']);
    expect(s().goals).toHaveLength(1);
    expect(s().goals[0].title).toBe('三个月内找到 Agent 实习');
    // 引导写入的记忆直接 confirmed，不需要再确认一次
    expect(s().memories.every((m) => m.status === 'confirmed')).toBe(true);
    // 图谱节点 + 自「我」出发的关系
    expect(s().entities.filter((e) => e.type !== 'self')).toHaveLength(2);
    expect(s().relations).toHaveLength(2);
  });

  test('completeOnboarding 允许跳过关注与目标，只改称呼', () => {
    s().completeOnboarding({ displayName: '阿哲', focus: '', goalTitle: '' });

    expect(s().settings.displayName).toBe('阿哲');
    expect(s().settings.onboarded).toBe(true);
    expect(s().memories).toHaveLength(0);
    expect(s().goals).toHaveLength(0);
  });

  test('planNextWeek 围绕进行中的目标排两件事，且都落在下周', () => {
    confirm(goalDraft('通过英语六级'));

    const count = s().planNextWeek();

    expect(count).toBe(2);
    const nextWeek = s().tasks.slice(-2);
    expect(nextWeek.every((task) => task.status === 'todo')).toBe(true);
    expect(nextWeek.every((task) => task.goalId === s().goals[0].id)).toBe(true);
    expect(nextWeek.every((task) => task.date > todayISO())).toBe(true);
  });

  test('没有目标时也能给出兜底计划', () => {
    expect(s().planNextWeek()).toBe(2);
    expect(s().tasks.every((task) => task.goalId === undefined)).toBe(true);
  });
});

describe('新用户起点 createEmptyData', () => {
  test('不含任何演示记忆，只有「我」和一条欢迎消息', () => {
    const empty = createEmptyData();

    expect(empty.memories).toHaveLength(0);
    expect(empty.goals).toHaveLength(0);
    expect(empty.tasks).toHaveLength(0);
    expect(empty.entities).toHaveLength(1);
    expect(empty.entities[0].type).toBe('self');
    expect(empty.messages).toHaveLength(1);
  });
});

describe('成长统计 computeGrowthStats', () => {
  const makeEvent = (date: string, hours: number, category: LearningEvent['category'] = 'study'): LearningEvent => ({
    id: `ev-${date}-${hours}`,
    title: '记录',
    category,
    duration: hours,
    date,
    source: '测试',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  const makeTask = (id: string, date: string, done: boolean): Task => ({
    id,
    title: '任务',
    date,
    duration: 1,
    status: done ? 'done' : 'todo',
    source: 'user',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  const emptyGoal = (): Goal => ({
    id: 'g1',
    title: '目标',
    description: '',
    deadline: addDaysISO(todayISO(), 30),
    progress: 0,
    status: 'active',
    milestones: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  test('空数据不抛错且各项为 0', () => {
    const stats = computeGrowthStats([], [], []);
    expect(stats.studyHours).toBe(0);
    expect(stats.totalTasks).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.daily).toHaveLength(7);
  });

  test('只统计本周学习类事件，并按天聚合', () => {
    const weekStart = startOfWeekISO();
    const today = todayISO();
    const lastWeek = addDaysISO(weekStart, -7);

    const stats = computeGrowthStats(
      [makeEvent(today, 2), makeEvent(today, 1.5), makeEvent(lastWeek, 5), makeEvent(today, 3, 'fitness')],
      [makeTask('t1', today, true), makeTask('t2', today, false), makeTask('t3', lastWeek, true)],
      [emptyGoal()],
    );

    expect(stats.studyHours).toBe(3.5);
    expect(stats.lastWeekStudyHours).toBe(5);
    expect(stats.completedTasks).toBe(1);
    expect(stats.totalTasks).toBe(2);
    expect(stats.completionRate).toBe(50);
    expect(stats.daily.reduce((sum, d) => sum + d.hours, 0)).toBe(3.5);
  });
});

describe('日期工具', () => {
  test('parseISO 落在本地中午，跨时区不会掉一天', () => {
    expect(parseISO('2026-11-06').getDate()).toBe(6);
    expect(parseISO('2026-11-06').getHours()).toBe(12);
  });

  test('diffDays 对今天/明天返回 0/1', () => {
    expect(diffDays(todayISO())).toBe(0);
    expect(diffDays(addDaysISO(todayISO(), 1))).toBe(1);
  });

  test('addDaysISO 跨月正确', () => {
    expect(addDaysISO('2026-01-31', 1)).toBe('2026-02-01');
  });
});
