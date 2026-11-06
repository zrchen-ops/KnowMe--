export type TaskStatus = 'todo' | 'done';
export type TaskSource = 'seed' | 'agent' | 'user';

export interface Task {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  duration: number;
  status: TaskStatus;
  allDay?: boolean;
  goalId?: string;
  entityId?: string;
  source: TaskSource;
  sourceMemoryId?: string;
  createdAt: string;
  updatedAt: string;
}
