import { IEarnedRewardPeriods } from '../../types/earned-reward-period';

export function parseEarnedRewardPeriods(
  value: unknown,
): IEarnedRewardPeriods {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as IEarnedRewardPeriods;
}
