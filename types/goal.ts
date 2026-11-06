export interface Milestone {
  id: string;
  title: string;
  done: boolean;
}

export type GoalStatus = 'active' | 'completed' | 'archived';

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  progress: number;
  status: GoalStatus;
  milestones: Milestone[];
  sourceMemoryId?: string;
  createdAt: string;
  updatedAt: string;
}
