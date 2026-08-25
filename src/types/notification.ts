export enum ENotificationType {
  task_assigned = 'task_assigned',
  task_completed = 'task_completed',
  task_approved = 'task_approved',
  task_rejected = 'task_rejected',
  reward_redemption_requested = 'reward_redemption_requested',
  reward_redemption_approved = 'reward_redemption_approved',
  reward_redemption_rejected = 'reward_redemption_rejected',
}

export interface INotification {
  id: string;
  userId: string;
  familyId?: string;
  type: ENotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}
