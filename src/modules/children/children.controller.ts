import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { RequireRole } from '../../common/decorators/require-role.decorator';
import { FamilyMemberGuard } from '../../common/guards/family-member.guard';
import { ERole } from '../../types/user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ChildrenService } from './children.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Controller('families/:familyId/children')
@UseGuards(JwtAuthGuard, FamilyMemberGuard)
export class ChildrenController {
  constructor(
    private readonly childrenService: ChildrenService,
  ) {}

  /**
   * GET /families/:familyId/children
   */
  @Get()
  listChildren(
    @Param('familyId') familyId: string,
  ) {
    return this.childrenService.listChildren(
      familyId,
    );
  }

  /**
   * GET /families/:familyId/children/:childUserId
   */
  @Get(':childUserId')
  getChild(
    @Param('familyId') familyId: string,
    @Param('childUserId') childUserId: string,
  ) {
    return this.childrenService.getChild(
      familyId,
      childUserId,
    );
  }

  /**
   * POST /families/:familyId/children
   */
  @Post()
  @RequireRole(ERole.admin, ERole.parent)
  createChild(
    @Param('familyId') familyId: string,
    @Body() dto: CreateChildDto,
  ) {
    return this.childrenService.createChild(
      familyId,
      dto,
    );
  }

  /**
   * PATCH /families/:familyId/children/:childUserId
   */
  @Patch(':childUserId')
  @RequireRole(ERole.admin, ERole.parent)
  updateChild(
    @Param('familyId') familyId: string,
    @Param('childUserId') childUserId: string,
    @Body() dto: UpdateChildDto,
  ) {
    return this.childrenService.updateChild(
      familyId,
      childUserId,
      dto,
    );
  }

  @Delete(':childUserId')
  @RequireRole(ERole.admin, ERole.parent)
  deleteChild(
    @Param('familyId') familyId: string,
    @Param('childUserId') childUserId: string,
  ) {
    return this.childrenService.deleteChild(
      familyId,
      childUserId,
    );
  }
}
