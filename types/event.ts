export type EventCategory = 'study' | 'fitness' | 'career' | 'life' | 'other';

export interface LearningEvent {
  id: string;
  title: string;
  category: EventCategory;
  duration: number;
  date: string;
  source: string;
  taskId?: string;
  goalId?: string;
  sourceMemoryId?: string;
  createdAt: string;
}
