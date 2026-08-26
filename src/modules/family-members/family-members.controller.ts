import {
  Body,
  Controller,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FamilyMemberGuard } from '../../common/guards/family-member.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload';

import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import { FamilyMembersService } from './family-members.service';

@Controller('families/:familyId/members')
@UseGuards(JwtAuthGuard, FamilyMemberGuard)
export class FamilyMembersController {
  constructor(
    private readonly familyMembersService: FamilyMembersService,
  ) {}

  @Patch('me')
  updateMyProfile(
    @Param('familyId') familyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMemberProfileDto,
  ) {
    return this.familyMembersService.updateMyProfile(
      familyId,
      user.sub,
      dto,
    );
  }
}
