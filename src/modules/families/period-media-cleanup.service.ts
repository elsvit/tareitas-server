import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

import { PrismaService } from '../../db/prisma.service';
import { ITaskAssignmentChange } from '../../types/task';
import { UploadsService } from '../uploads/uploads.service';

import {
  getApprovedPeriodMediaCutoffYearMonth,
  isCustomUploadPath,
} from './earned-reward-period.utils';
import { APPROVED_PERIOD_MEDIA_RETENTION_MONTHS } from '../../constants/support-constants';

type AssignmentChanges = Record<string, ITaskAssignmentChange>;

@Injectable()
export class PeriodMediaCleanupService {
  private readonly logger = new Logger(
    PeriodMediaCleanupService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async cleanupForNewlyApprovedPeriods(
    familyId: string,
    approvals: Array<{ childId: string; yearMonth: string }>,
  ) {
    for (const approval of approvals) {
      await this.cleanupForApprovedPeriod(
        familyId,
        approval.childId,
        approval.yearMonth,
      );
    }
  }

  private async cleanupForApprovedPeriod(
    familyId: string,
    childId: string,
    approvedYearMonth: string,
  ) {
    const cutoffYearMonth = getApprovedPeriodMediaCutoffYearMonth(
      approvedYearMonth,
    );

    const assignments =
      await this.prisma.taskAssignment.findMany({
        where: { familyId, childId },
        select: {
          id: true,
          picture: true,
          changes: true,
        },
      });

    for (const assignment of assignments) {
      const changes = (assignment.changes ??
        {}) as AssignmentChanges;
      let changed = false;
      const nextChanges: AssignmentChanges = {
        ...changes,
      };

      for (const [date, change] of Object.entries(changes)) {
        const changeYearMonth = date.slice(0, 7);

        if (changeYearMonth > cutoffYearMonth) {
          continue;
        }

        const nextChange = { ...change };
        let changeUpdated = false;

        if (change.audioRecord) {
          await this.uploadsService.deleteMediaFileIfExists(
            familyId,
            change.audioRecord,
          );
          delete nextChange.audioRecord;
          changeUpdated = true;
        }

        if (isCustomUploadPath(change.picture)) {
          await this.uploadsService.deleteMediaFileIfExists(
            familyId,
            change.picture,
          );
          delete nextChange.picture;
          changeUpdated = true;
        }

        if (!changeUpdated) {
          continue;
        }

        if (Object.keys(nextChange).length === 0) {
          delete nextChanges[date];
        } else {
          nextChanges[date] = nextChange;
        }

        changed = true;
      }

      if (!changed) {
        continue;
      }

      await this.prisma.taskAssignment.update({
        where: { id: assignment.id },
        data: {
          changes:
            Object.keys(nextChanges).length > 0
              ? (nextChanges as Prisma.InputJsonValue)
              : Prisma.JsonNull,
        },
      });
    }

    this.logger.log(
      `Cleaned task media for family ${familyId}, child ${childId}, approved ${approvedYearMonth} (cutoff ${cutoffYearMonth}, retention ${APPROVED_PERIOD_MEDIA_RETENTION_MONTHS} months)`,
    );
  }
}
