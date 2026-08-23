import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload';

import { CreateFamilyDto } from './dto/create-family.dto';
import { FamiliesService } from './families.service';

@Controller('families')
@UseGuards(JwtAuthGuard)
export class FamiliesController {
  constructor(
    private readonly familiesService: FamiliesService,
  ) {}

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
   * GET /families/:familyId
   *
   * Returns the family only if the current user
   * is a member of it.
   */
  @Get(':familyId')
  getFamily(
    @CurrentUser() user: JwtPayload,
    @Param('familyId') familyId: string,
  ) {
    return this.familiesService.getFamily(
      user.sub,
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
    );
  }
}