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

import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { ParentsService } from './parents.service';

@Controller('families/:familyId/parents')
@UseGuards(JwtAuthGuard, FamilyMemberGuard)
export class ParentsController {
  constructor(
    private readonly parentsService: ParentsService,
  ) {}

  @Get()
  listParents(@Param('familyId') familyId: string) {
    return this.parentsService.listParents(familyId);
  }

  @Get(':parentUserId')
  getParent(
    @Param('familyId') familyId: string,
    @Param('parentUserId') parentUserId: string,
  ) {
    return this.parentsService.getParent(
      familyId,
      parentUserId,
    );
  }

  @Post()
  @RequireRole(ERole.admin, ERole.parent)
  createParent(
    @Param('familyId') familyId: string,
    @Body() dto: CreateParentDto,
  ) {
    return this.parentsService.createParent(
      familyId,
      dto,
    );
  }

  @Patch(':parentUserId')
  @RequireRole(ERole.admin, ERole.parent)
  updateParent(
    @Param('familyId') familyId: string,
    @Param('parentUserId') parentUserId: string,
    @Body() dto: UpdateParentDto,
  ) {
    return this.parentsService.updateParent(
      familyId,
      parentUserId,
      dto,
    );
  }

  @Delete(':parentUserId')
  @RequireRole(ERole.admin, ERole.parent)
  deleteParent(
    @Param('familyId') familyId: string,
    @Param('parentUserId') parentUserId: string,
  ) {
    return this.parentsService.deleteParent(
      familyId,
      parentUserId,
    );
  }
}
