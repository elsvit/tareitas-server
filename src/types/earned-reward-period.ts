export interface IEarnedRewardPeriodChildBalance {
  remainingRewardFromPreviousMonths: number | null;
  monthReward: number;
  isPeriodApproved?: boolean;
}

export interface IEarnedRewardPeriod {
  yearMonth: string;
  [childUserId: string]: IEarnedRewardPeriodChildBalance | string;
}

export type IEarnedRewardPeriods = IEarnedRewardPeriod[];
