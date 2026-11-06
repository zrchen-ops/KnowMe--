import type { EventCategory } from './event';

export type EntityType = 'self' | 'person' | 'goal' | 'plan' | 'event' | 'interest' | 'career';

export type MemoryStatus = 'pending' | 'confirmed' | 'rejected';
export type MemoryType = 'goal' | 'task' | 'event' | 'interest' | 'person' | 'plan' | 'preference';
export type MemoryOrigin = 'user' | 'ai';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description: string;
  confirmed: boolean;
  goalId?: string;
  sourceMemoryId?: string;
  position: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  confidence: number;
}

export interface MemoryPayload {
  entityName?: string;
  entityType?: EntityType;
  relationType?: string;
  description?: string;
  goal?: {
    title: string;
    description: string;
    deadline: string;
    progress?: number;
    milestones?: string[];
  };
  task?: {
    title: string;
    date: string;
    startTime?: string;
    duration: number;
    goalTitle?: string;
    allDay?: boolean;
  };
  event?: {
    title: string;
    category: EventCategory;
    duration: number;
    date: string;
  };
  goalTitle?: string;
  taskId?: string;
}

export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  source: string;
  confidence: number;
  status: MemoryStatus;
  origin: MemoryOrigin;
  payload?: MemoryPayload;
  createdAt: string;
  updatedAt: string;
}
