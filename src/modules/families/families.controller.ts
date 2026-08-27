import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireOwner } from '../../common/decorators/require-owner.decorator';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { FamilyMemberGuard } from '../../common/guards/family-member.guard';
import { ERole } from '../../types/user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload';

import { CreateFamilyDto } from './dto/create-family.dto';
import { PutEarnedRewardPeriodsDto } from './dto/earned-reward-periods.dto';
import { FamiliesService } from './families.service';
import { UpdateFamilyDto } from './dto/update-family.dto';

@Controller('families')
@UseGuards(JwtAuthGuard)
export class FamiliesController {
  constructor(
    private readonly familiesService: FamiliesService,
  ) { }

  /**
   * GET /families/me
   *
   * Returns all families the current user belongs to.
   */
  @Get('me')
  getMyFamilies(
    @CurrentUser() user: JwtPayload,
  ) {
    return this.familiesService.getMyFamilies(
      user.sub,
    );
  }

  /**
   * GET /families/:familyId/earned-reward-periods
   */
  @Get(':familyId/earned-reward-periods')
  @UseGuards(FamilyMemberGuard)
  getEarnedRewardPeriods(
    @Param('familyId') familyId: string,
  ) {
    return this.familiesService.getEarnedRewardPeriods(
      familyId,
    );
  }

  /**
   * PUT /families/:familyId/earned-reward-periods
   */
  @Put(':familyId/earned-reward-periods')
  @UseGuards(FamilyMemberGuard)
  @RequireRole(ERole.admin, ERole.parent)
  putEarnedRewardPeriods(
    @Param('familyId') familyId: string,
    @Body() dto: PutEarnedRewardPeriodsDto,
  ) {
    return this.familiesService.putEarnedRewardPeriods(
      familyId,
      dto,
    );
  }

  /**
   * GET /families/:familyId
   *
   * Returns the family only if the current user
   * is a member of it.
   */
  @Get(':familyId')
  @UseGuards(FamilyMemberGuard)
  getFamily(
    @Param('familyId') familyId: string,
  ) {
    return this.familiesService.getFamily(
      familyId,
    );
  }

  /**
   * POST /families
   *
   * Creates a family and makes the current user
   * its owner.
   */
  @Post()
  createFamily(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFamilyDto,
  ) {
    return this.familiesService.createFamily(
      user.sub,
      dto.name,
      dto.parentProfile,
    );
  }

  @Patch(':familyId')
  @UseGuards(FamilyMemberGuard)
  @RequireOwner()
  updateFamily(
    @Param('familyId') familyId: string,
    @Body() dto: UpdateFamilyDto,
  ) {
    return this.familiesService.updateFamily(
      familyId,
      dto.name,
    );
  }
}