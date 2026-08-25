import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { RequireRole } from '../../common/decorators/require-role.decorator';
import { FamilyMemberGuard } from '../../common/guards/family-member.guard';
import { ERole } from '../../types/user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CatalogService } from './catalog.service';
import {
  GetCatalogQueryDto,
  SyncCatalogDto,
} from './dto/catalog.dto';

@Controller('families/:familyId/catalog')
@UseGuards(JwtAuthGuard, FamilyMemberGuard)
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
  ) {}

  @Get()
  async getCatalog(
    @Param('familyId') familyId: string,
    @Query() query: GetCatalogQueryDto,
    @Res({ passthrough: true })
    res: Response,
  ) {
    const catalog =
      await this.catalogService.getCatalog(
        familyId,
        query,
      );

    if (!catalog) {
      res.status(HttpStatus.NOT_MODIFIED);
      return;
    }

    return catalog;
  }

  @Post('sync')
  @RequireRole(ERole.admin, ERole.parent)
  syncCatalog(
    @Param('familyId') familyId: string,
    @Body() dto: SyncCatalogDto,
  ) {
    return this.catalogService.syncCatalog(
      familyId,
      dto,
    );
  }
}
