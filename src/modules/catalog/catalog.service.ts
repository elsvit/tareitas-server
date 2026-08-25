import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { IFamilyCatalog } from '../../types/catalog';

import { toFamilyCatalog } from './catalog.mapper';
import { CatalogRepository } from './catalog.repository';
import {
  GetCatalogQueryDto,
  SyncCatalogDto,
} from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(
    private readonly catalogRepository: CatalogRepository,
  ) {}

  async getCatalog(
    familyId: string,
    query: GetCatalogQueryDto,
  ): Promise<IFamilyCatalog | null> {
    const data =
      await this.catalogRepository.findCatalogItems(
        familyId,
      );

    if (!data) {
      throw new AppException(
        ErrorCode.FAMILY_NOT_FOUND,
        'Family not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const unchanged =
      query.taskRevision !== undefined &&
      query.rewardRevision !== undefined &&
      query.taskRevision ===
        data.taskBaseRevision &&
      query.rewardRevision ===
        data.rewardBaseRevision;

    if (unchanged) {
      return null;
    }

    return toFamilyCatalog({
      taskBaseRevision: data.taskBaseRevision,
      rewardBaseRevision:
        data.rewardBaseRevision,
      bundledTaskCatalogVersion:
        data.bundledTaskCatalogVersion,
      bundledRewardCatalogVersion:
        data.bundledRewardCatalogVersion,
      taskBaseItems: data.taskBaseItems,
      rewardBaseItems: data.rewardBaseItems,
    });
  }

  async getCatalogMeta(familyId: string) {
    const meta =
      await this.catalogRepository.findFamilyCatalogMeta(
        familyId,
      );

    if (!meta) {
      throw new AppException(
        ErrorCode.FAMILY_NOT_FOUND,
        'Family not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return meta;
  }

  async syncCatalog(
    familyId: string,
    dto: SyncCatalogDto,
  ): Promise<IFamilyCatalog> {
    const meta =
      await this.getCatalogMeta(familyId);

    const hasTaskChanges =
      (dto.taskBase?.length ?? 0) > 0 ||
      (dto.removedTaskBaseIds?.length ?? 0) > 0;

    const hasRewardChanges =
      (dto.rewardBase?.length ?? 0) > 0 ||
      (dto.removedRewardBaseIds?.length ?? 0) > 0;

    const bundledTaskVersionBump =
      dto.bundledTaskCatalogVersion !==
        undefined &&
      dto.bundledTaskCatalogVersion >
        meta.bundledTaskCatalogVersion;

    const bundledRewardVersionBump =
      dto.bundledRewardCatalogVersion !==
        undefined &&
      dto.bundledRewardCatalogVersion >
        meta.bundledRewardCatalogVersion;

    const bumpTaskRevision =
      hasTaskChanges ||
      bundledTaskVersionBump;

    const bumpRewardRevision =
      hasRewardChanges ||
      bundledRewardVersionBump;

    if (
      !bumpTaskRevision &&
      !bumpRewardRevision
    ) {
      const current =
        await this.catalogRepository.findCatalogItems(
          familyId,
        );

      return toFamilyCatalog({
        taskBaseRevision:
          current!.taskBaseRevision,
        rewardBaseRevision:
          current!.rewardBaseRevision,
        bundledTaskCatalogVersion:
          current!.bundledTaskCatalogVersion,
        bundledRewardCatalogVersion:
          current!.bundledRewardCatalogVersion,
        taskBaseItems: current!.taskBaseItems,
        rewardBaseItems:
          current!.rewardBaseItems,
      });
    }

    const bundledTaskCatalogVersion =
      bundledTaskVersionBump
        ? dto.bundledTaskCatalogVersion
        : undefined;

    const bundledRewardCatalogVersion =
      bundledRewardVersionBump
        ? dto.bundledRewardCatalogVersion
        : undefined;

    const updated =
      await this.catalogRepository.syncCatalog(
        familyId,
        {
          taskBase: dto.taskBase,
          rewardBase: dto.rewardBase,
          removedTaskBaseIds:
            dto.removedTaskBaseIds,
          removedRewardBaseIds:
            dto.removedRewardBaseIds,
          bundledTaskCatalogVersion,
          bundledRewardCatalogVersion,
          bumpTaskRevision,
          bumpRewardRevision,
        },
      );

    return toFamilyCatalog({
      taskBaseRevision: updated!.taskBaseRevision,
      rewardBaseRevision:
        updated!.rewardBaseRevision,
      bundledTaskCatalogVersion:
        updated!.bundledTaskCatalogVersion,
      bundledRewardCatalogVersion:
        updated!.bundledRewardCatalogVersion,
      taskBaseItems: updated!.taskBaseItems,
      rewardBaseItems: updated!.rewardBaseItems,
    });
  }
}
