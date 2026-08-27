export enum ETaskStatus {
  pending = 'pending',
  completed = 'completed',
  approved = 'approved',
  rejected = 'rejected',
}

export enum ETaskRepeatType {
  none = 'none',
  day = 'day',
  week = 'week',
  month = 'month',
}

export interface ISubtask {
  value: string;
  label: string;
}

export interface ITaskAssignmentChange {
  time?: string;
  name?: string;
  description?: string;
  reward?: number;
  picture?: string;
  newTaskBonus?: number;
  newTaskDuration?: number;
  excluded?: boolean;
}

export interface ITaskAssignmentRepeat {
  type: ETaskRepeatType;
  weekDays?: number[];
  count?: number;
}

export interface ITaskAssignment {
  id: string;
  familyId: string;
  childId: string;
  title: string;
  description?: string;
  reward?: number;
  picture?: string;
  color?: string;
  startDate: string;
  endDate?: string;
  time: string;
  isHabit?: boolean;
  repeat?: ITaskAssignmentRepeat;
  newTaskBonus?: number;
  newTaskDuration?: number;
  subtasks?: ISubtask[];
  changes?: Record<string, ITaskAssignmentChange>;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITask {
  id: string;
  familyId: string;
  assignmentId: string;
  date: string;
  status: ETaskStatus;
  completedSubtasks?: string[];
  createdAt: string;
  updatedAt: string;
}
