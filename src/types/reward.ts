export interface IReward {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  cost: number;
  isActive: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export enum ERewardRedemptionStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
}

export interface IRewardRedemption {
  id: string;
  familyId: string;
  rewardId: string;
  childUserId: string;
  cost: number;
  status: ERewardRedemptionStatus;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}
