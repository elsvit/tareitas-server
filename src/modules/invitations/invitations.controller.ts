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

import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationsService } from './invitations.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
  ) {}

  /**
   * POST /families/:familyId/invitations
   */
  @Post('families/:familyId/invitations')
  createInvitation(
    @CurrentUser() user: JwtPayload,
    @Param('familyId') familyId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.createInvitation(
      user.sub,
      familyId,
      dto,
    );
  }

  /**
   * GET /invitations/me
   */
  @Get('invitations/me')
  getMyInvitations(
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invitationsService.getMyInvitations(
      user.sub,
    );
  }

  /**
   * POST /invitations/:invitationId/accept
   */
  @Post('invitations/:invitationId/accept')
  acceptInvitation(
    @CurrentUser() user: JwtPayload,
    @Param('invitationId')
    invitationId: string,
  ) {
    return this.invitationsService.acceptInvitation(
      user.sub,
      invitationId,
    );
  }

  /**
   * POST /invitations/:invitationId/reject
   */
  @Post('invitations/:invitationId/reject')
  rejectInvitation(
    @CurrentUser() user: JwtPayload,
    @Param('invitationId')
    invitationId: string,
  ) {
    return this.invitationsService.rejectInvitation(
      user.sub,
      invitationId,
    );
  }
}