import type { ChatKind, Entity, Goal, LearningEvent, Memory, MemoryPayload, MemoryType, MemoryOrigin, Task } from '@/types';

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
}

export interface AgentService {
  respond(input: string, context: AgentContext): Promise<AgentResponse>;
}
