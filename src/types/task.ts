export enum ETaskStatus {
  pending = 'pending',
  completed = 'completed',
  approved = 'approved',
  rejected = 'rejected',
}

export interface ITask {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  assignedToUserId: string;
  createdByUserId: string;
  points: number;
  status: ETaskStatus;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
