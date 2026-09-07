import {
  IEarnedRewardPeriod,
  IEarnedRewardPeriodChildBalance,
  IEarnedRewardPeriods,
} from '../../types/earned-reward-period';
import { APPROVED_PERIOD_MEDIA_RETENTION_MONTHS } from '../../constants/support-constants';

export function isEarnedPeriodChildBalance(
  value: unknown,
): value is IEarnedRewardPeriodChildBalance {
  return (
    !!value &&
    typeof value === 'object' &&
    ((value as IEarnedRewardPeriodChildBalance)
      .remainingRewardFromPreviousMonths === null ||
      typeof (value as IEarnedRewardPeriodChildBalance)
        .remainingRewardFromPreviousMonths === 'number') &&
    typeof (value as IEarnedRewardPeriodChildBalance).monthReward ===
      'number'
  );
}

export function subtractMonthsFromYearMonth(
  yearMonth: string,
  months: number,
): string {
  const [yearPart, monthPart] = yearMonth.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const date = new Date(year, month - 1, 1);

  date.setMonth(date.getMonth() - months);

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');

  return `${nextYear}-${nextMonth}`;
}

export function getApprovedPeriodMediaCutoffYearMonth(
  approvedYearMonth: string,
): string {
  return subtractMonthsFromYearMonth(
    approvedYearMonth,
    APPROVED_PERIOD_MEDIA_RETENTION_MONTHS,
  );
}

export function findNewlyApprovedPeriods(
  previousPeriods: IEarnedRewardPeriods,
  nextPeriods: IEarnedRewardPeriods,
): Array<{ childId: string; yearMonth: string }> {
  const wasApproved = new Map<string, boolean>();

  for (const period of previousPeriods) {
    for (const [childId, value] of Object.entries(period)) {
      if (childId === 'yearMonth') {
        continue;
      }

      if (!isEarnedPeriodChildBalance(value)) {
        continue;
      }

      wasApproved.set(
        `${period.yearMonth}:${childId}`,
        value.isPeriodApproved === true,
      );
    }
  }

  const newlyApproved: Array<{ childId: string; yearMonth: string }> =
    [];

  for (const period of nextPeriods) {
    for (const [childId, value] of Object.entries(period)) {
      if (childId === 'yearMonth') {
        continue;
      }

      if (!isEarnedPeriodChildBalance(value)) {
        continue;
      }

      const key = `${period.yearMonth}:${childId}`;

      if (
        value.isPeriodApproved === true &&
        wasApproved.get(key) !== true
      ) {
        newlyApproved.push({
          childId,
          yearMonth: period.yearMonth,
        });
      }
    }
  }

  return newlyApproved;
}

export function isCustomUploadPath(
  value?: string | null,
): value is string {
  return !!value && value.startsWith('/uploads/');
}
