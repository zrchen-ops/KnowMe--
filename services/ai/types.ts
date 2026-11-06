import type { ChatKind, Entity, Goal, LearningEvent, Memory, MemoryOrigin, MemoryPayload, MemoryType, Task } from '@/types';

export interface AgentContext {
  memories: Memory[];
  entities: Entity[];
  goals: Goal[];
  tasks: Task[];
  events: LearningEvent[];
}

export interface MemoryDraft {
  content: string;
  type: MemoryType;
  confidence: number;
  origin: MemoryOrigin;
  source: string;
  payload: MemoryPayload;
}

export interface AgentResponse {
  text: string;
  kind: ChatKind;
  memoryDraft?: MemoryDraft;
  taskIds?: string[];
  /** 服务端实际使用的 provider（stub / deepseek / openai / mock）。 */
  provider?: string;
  /** 远端不可用、本条回复由本地规则引擎兜底产生。 */
  degraded?: boolean;
}

export interface AgentService {
  respond(input: string, context: AgentContext): Promise<AgentResponse>;
}
