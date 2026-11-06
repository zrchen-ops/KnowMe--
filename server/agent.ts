/**
 * Agent 服务端的核心：提示词构造 + 模型输出归一化。
 *
 * 客户端（React Native）与本文件共用同一份「AgentResponse」契约，但类型是各自声明的：
 * 服务端要能独立部署，不该依赖客户端的 `@/` 别名与打包器。
 */
import type { ChatMessage, ProviderConfig } from './provider.ts';
import { complete } from './provider.ts';

export type MemoryType = 'goal' | 'task' | 'event' | 'interest' | 'person' | 'plan' | 'preference' | 'habit';
export type EntityType = 'self' | 'person' | 'goal' | 'plan' | 'event' | 'interest' | 'career';
export type ChatKind = 'text' | 'memory' | 'plan' | 'review' | 'tip';

export interface GoalPayload {
  title: string;
  description: string;
  deadline: string;
  progress?: number;
  milestones?: string[];
}

export interface TaskPayload {
  title: string;
  date: string;
  startTime?: string;
  duration: number;
  goalTitle?: string;
  allDay?: boolean;
}

export interface EventPayload {
  title: string;
  category: 'study' | 'fitness' | 'life' | 'career';
  duration: number;
  date: string;
}

export interface MemoryPayloadLike {
  entityName?: string;
  entityType?: EntityType;
  relationType?: string;
  description?: string;
  goal?: GoalPayload;
  task?: TaskPayload;
  event?: EventPayload;
  goalTitle?: string;
}

export interface MemoryDraftLike {
  content: string;
  type: MemoryType;
  confidence: number;
  origin: 'user' | 'ai';
  source: string;
  payload: MemoryPayloadLike;
}

export interface AgentResponseLike {
  text: string;
  kind: ChatKind;
  memoryDraft?: MemoryDraftLike;
  provider?: string;
}

export interface AgentContextLike {
  memories?: Array<{ content?: string; type?: string; status?: string }>;
  entities?: Array<{ name?: string; type?: string; description?: string }>;
  goals?: Array<{ title?: string; deadline?: string; progress?: number; status?: string }>;
  tasks?: Array<{ title?: string; date?: string; status?: string }>;
  events?: Array<{ title?: string; date?: string; duration?: number; category?: string }>;
}

export class AgentError extends Error {
  code: 'bad_output' | 'provider_error' | 'provider_not_configured';
  constructor(code: AgentError['code'], message: string) {
    super(message);
    this.name = 'AgentError';
    this.code = code;
  }
}

const MEMORY_TYPES: MemoryType[] = [
  'goal',
  'task',
  'event',
  'interest',
  'person',
  'plan',
  'preference',
  'habit',
];
const KINDS: ChatKind[] = ['text', 'memory', 'plan', 'review', 'tip'];

const RELATION_BY_TYPE: Record<MemoryType, string> = {
  goal: '拥有目标',
  task: '计划',
  event: '记录',
  interest: '感兴趣',
  person: '认识',
  plan: '正在推进',
  preference: '偏好',
  habit: '习惯',
};

const ENTITY_TYPE_BY_MEMORY: Record<MemoryType, EntityType> = {
  goal: 'goal',
  task: 'plan',
  event: 'event',
  person: 'person',
  interest: 'interest',
  plan: 'plan',
  preference: 'plan',
  habit: 'plan',
};

export const SYSTEM_PROMPT = `你是 KnowMe（知我）的记忆整理器。用户对你说话，你的任务是：
1) 用一句自然、克制的中文回应（reply）；
2) 如果这句话里包含值得长期记住的个人信息，抽成一条结构化记忆（memory），否则 memory 为 null。

只输出一个 JSON 对象，不要 markdown 代码块，不要多余文字。结构：
{
  "reply": "给用户看的中文回应，40 字以内，不要复述格式",
  "kind": "text | memory | plan | review",
  "memory": null | {
    "type": "goal | task | event | interest | person | plan | preference | habit",
    "content": "用户原话或忠实概括",
    "confidence": 0.0-1.0,
    "entityName": "节点名，2-12 字，名词短语",
    "entityType": "goal | plan | event | person | interest | career",
    "relationType": "可选，默认按类型决定",
    "description": "一句话说明这个节点是什么",
    "goal": { "title": "", "description": "", "deadline": "YYYY-MM-DD", "milestones": ["", ""] },
    "task": { "title": "", "date": "YYYY-MM-DD", "startTime": "HH:mm", "duration": 1.5 },
    "event": { "title": "", "category": "study | fitness | life | career", "duration": 2, "date": "YYYY-MM-DD" }
  }
}

硬性规则：
- 绝不编造用户没说过的信息；不确定就把 confidence 降到 0.6 以下，但 memory 仍然可以是 null。
- type 与 payload 必须匹配：goal 带 goal，task 带 task，event 带 event；其余类型不需要 payload。
- 纯寒暄、闲聊、提问知识、求助建议 → memory 为 null，kind=text。
- 情绪倾诉可以给 kind=text 的克制回应，不要强行抽取记忆。
- 相对时间（明天/下周/这学期）换算成绝对日期，今天是 {TODAY}。
- 日期一律 YYYY-MM-DD，时间一律 24 小时制 HH:mm。
- duration 单位是小时，可以是 0.5 的倍数。
- relationType 用中文短语（拥有目标 / 计划 / 记录 / 认识 / 感兴趣 / 偏好 / 习惯 / 关注）。
- 涉及金额、转账、订票、发送给他人的消息 → 只回应，不抽取记忆，并在 reply 里说明需要用户确认。

类型判别（最容易混淆，按顺序判断）：
1. 事情**已经发生**（「看完了」「去了」「打了」「完成了」）→ event，即使谈话里提到书、电影、比赛、课程。
2. 事情**还没发生**、要在某个时间去做（「开组会」「交作业」「复习」）→ task；从语句里找出时间，找不到就放到今天。
3. 只是表达**喜欢/关注/在追**，没有完成动作 → interest（不要写成 event）。
4. 长期方向或结果（「想…」「希望…」「目标是…」）→ goal。
5. 单次对话里的态度与选择（「我不吃香菜」「我更喜欢早上学习」）→ preference。
6. 反复出现的固定行为（「每天早上七点」「每周三晚上」）→ habit。

示例：
- 「今天下午四点开组会」→ task（还没发生，16:00，今天）
- 「我看完了《人类简史》」→ event（已经发生，不要因为提到书就判成 interest）
- 「我最近在追《万神殿》」→ interest（只是关注，没有完成动作）
- 「我认识了一个叫陈晨的同学」→ person（entityName 用「陈晨」，不要用关系描述）`;

export function buildMessages(
  input: string,
  context: AgentContextLike,
  today: string,
): ChatMessage[] {
  const contextLines: string[] = [];
  const memories = (context.memories ?? []).slice(-12);
  if (memories.length > 0) {
    contextLines.push(
      `已知记忆：\n${memories.map((m) => `- [${m.type}] ${m.content}`).join('\n')}`,
    );
  }
  const goals = (context.goals ?? []).filter((g) => g.status === 'active').slice(0, 5);
  if (goals.length > 0) {
    contextLines.push(
      `进行中的目标：\n${goals
        .map((g) => `- ${g.title}（截止 ${g.deadline}，进度 ${g.progress ?? 0}%）`)
        .join('\n')}`,
    );
  }
  const tasks = (context.tasks ?? []).filter((t) => t.status !== 'done').slice(0, 8);
  if (tasks.length > 0) {
    contextLines.push(`待办：\n${tasks.map((t) => `- ${t.title} @ ${t.date}`).join('\n')}`);
  }
  const entities = (context.entities ?? []).filter((e) => e.type !== 'self').slice(0, 12);
  if (entities.length > 0) {
    contextLines.push(`图谱节点：${entities.map((e) => e.name).join('、')}`);
  }

  return [
    { role: 'system', content: SYSTEM_PROMPT.replace('{TODAY}', today) },
    {
      role: 'user',
      content:
        contextLines.length > 0
          ? `【当前上下文】\n${contextLines.join('\n\n')}\n\n【用户这句话】\n${input}`
          : `【用户这句话】\n${input}`,
    },
  ];
}

function asString(value: unknown, max = 200): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function asDate(value: unknown, fallback: string): string {
  const raw = asString(value, 10);
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : fallback;
}

function asTime(value: unknown): string | undefined {
  const raw = asString(value, 5);
  return raw && /^\d{1,2}:\d{2}$/.test(raw) ? raw : undefined;
}

function asHours(value: unknown, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.min(12, Math.round(num * 2) / 2);
}

function asConfidence(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 0.75;
  return Math.max(0.3, Math.min(1, Math.round(num * 100) / 100));
}

function asCategory(value: unknown): EventPayload['category'] {
  return value === 'fitness' || value === 'life' || value === 'career' ? value : 'study';
}

/** 从模型输出里取出 JSON：容忍 ```json 包裹、前后多余文字。 */
export function extractJSON(raw: string): unknown {
  const text = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new AgentError('bad_output', 'model_output_not_json');
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new AgentError('bad_output', 'model_output_invalid_json');
  }
}

export interface NormalizeOptions {
  today: string;
  dateLabel: string;
  provider: string;
}

/** 把模型输出校验/收敛成客户端契约；不合法的字段丢弃而不是抛错。 */
export function normalizeModelOutput(raw: string, options: NormalizeOptions): AgentResponseLike {
  const parsed = extractJSON(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new AgentError('bad_output', 'model_output_not_object');
  }
  const data = parsed as Record<string, unknown>;
  const reply = asString(data.reply, 200);
  if (!reply) throw new AgentError('bad_output', 'missing_reply');

  const memoryRaw = data.memory;
  let memoryDraft: MemoryDraftLike | undefined;

  if (memoryRaw && typeof memoryRaw === 'object') {
    const memory = memoryRaw as Record<string, unknown>;
    const type = memory.type as MemoryType;
    if (MEMORY_TYPES.includes(type)) {
      const entityName = asString(memory.entityName, 40);
      if (entityName) {
        // 节点类型由记忆类型决定，不采用模型自己的判断：
        // 否则同一个 task 可能一会是 plan 一会是 event，图谱配色与筛选就乱了。
        const entityType: EntityType = ENTITY_TYPE_BY_MEMORY[type];

        // 关系名要求中文短语；模型偶尔会回英文（acquaintance），统一回落到类型默认值
        const declaredRelation = asString(memory.relationType, 16);
        const relationType =
          declaredRelation && /[\u4e00-\u9fa5]/.test(declaredRelation)
            ? declaredRelation
            : RELATION_BY_TYPE[type];

        const payload: MemoryPayloadLike = {
          entityName,
          entityType,
          relationType,
          description: asString(memory.description, 120) ?? asString(memory.content, 120) ?? entityName,
        };

        if (type === 'goal') {
          const goal = (memory.goal ?? {}) as Record<string, unknown>;
          const title = asString(goal.title, 30) ?? entityName;
          payload.goal = {
            title,
            description: asString(goal.description, 160) ?? payload.description ?? title,
            deadline: asDate(goal.deadline, options.today),
            milestones: Array.isArray(goal.milestones)
              ? goal.milestones.map((m) => asString(m, 40)).filter((m): m is string => Boolean(m)).slice(0, 5)
              : undefined,
          };
        } else if (type === 'task') {
          const task = (memory.task ?? {}) as Record<string, unknown>;
          payload.task = {
            title: asString(task.title, 30) ?? entityName,
            date: asDate(task.date, options.today),
            startTime: asTime(task.startTime),
            duration: asHours(task.duration, 1),
            allDay: task.allDay === true,
          };
          const goalTitle = asString(task.goalTitle, 30);
          if (goalTitle) payload.task.goalTitle = goalTitle;
        } else if (type === 'event') {
          const event = (memory.event ?? {}) as Record<string, unknown>;
          payload.event = {
            title: asString(event.title, 30) ?? entityName,
            category: asCategory(event.category),
            duration: asHours(event.duration, 1),
            date: asDate(event.date, options.today),
          };
          const goalTitle = asString(event.goalTitle, 30);
          if (goalTitle) payload.goalTitle = goalTitle;
        }

        memoryDraft = {
          content: asString(memory.content, 300) ?? entityName,
          type,
          confidence: asConfidence(memory.confidence),
          origin: 'user',
          source: `${options.dateLabel} 与 Agent 的对话`,
          payload,
        };
      }
    }
  }

  const declaredKind = data.kind as ChatKind;
  const kind: ChatKind = KINDS.includes(declaredKind)
    ? declaredKind
    : memoryDraft
      ? 'memory'
      : 'text';

  return {
    text: reply,
    // 抽取到记忆时，客户端要渲染确认卡片，kind 必须是 memory
    kind: memoryDraft ? 'memory' : kind,
    memoryDraft,
    provider: options.provider,
  };
}

export async function respond(
  input: string,
  context: AgentContextLike,
  config: ProviderConfig,
  options: { today: string; dateLabel: string; timeoutMs?: number; signal?: AbortSignal },
): Promise<AgentResponseLike> {
  if (config.name === 'none') {
    throw new AgentError('provider_not_configured', '没有配置任何模型 API Key');
  }
  const messages = buildMessages(input, context, options.today);
  let raw: string;
  try {
    raw = await complete(config, messages, { timeoutMs: options.timeoutMs, signal: options.signal });
  } catch (error) {
    throw new AgentError('provider_error', (error as Error).message);
  }
  return normalizeModelOutput(raw, {
    today: options.today,
    dateLabel: options.dateLabel,
    provider: config.name,
  });
}
