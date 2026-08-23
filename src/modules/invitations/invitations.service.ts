import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { randomBytes } from 'crypto';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { InvitationsRepository } from './invitations.repository';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationsRepository: InvitationsRepository,
  ) {}

  async createInvitation(
    currentUserId: string,
    familyId: string,
    input: {
      email?: string;
      username?: string;
    },
  ) {
    const { email, username } = input;

    if (!email && !username) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Email or username is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (email && username) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Provide either email or username, not both',
        HttpStatus.BAD_REQUEST,
      );
    }

    const currentMember =
      await this.invitationsRepository.findFamilyMember(
        familyId,
        currentUserId,
      );

    if (!currentMember) {
      throw new AppException(
        ErrorCode.FAMILY_MEMBER_NOT_FOUND,
        'You are not a member of this family',
        HttpStatus.FORBIDDEN,
      );
    }

    if (currentMember.role !== 'parent') {
      throw new AppException(
        ErrorCode.INVITATION_NOT_ALLOWED,
        'Only parents can invite family members',
        HttpStatus.FORBIDDEN,
      );
    }

    let invitedUser = null;

    if (email) {
      invitedUser =
        await this.invitationsRepository.findUserByEmail(
          email,
        );
    }

    if (username) {
      invitedUser =
        await this.invitationsRepository.findUserByUsername(
          username,
        );
    }

    if (
      invitedUser &&
      invitedUser.id === currentUserId
    ) {
      throw new AppException(
        ErrorCode.INVITATION_SELF_INVITE,
        'You cannot invite yourself',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (invitedUser) {
      const existingMember =
        await this.invitationsRepository.findFamilyMember(
          familyId,
          invitedUser.id,
        );

      if (existingMember) {
        throw new AppException(
          ErrorCode.FAMILY_MEMBER_ALREADY_EXISTS,
          'User is already a member of this family',
          HttpStatus.CONFLICT,
        );
      }
    }

    const existingInvitation =
      await this.invitationsRepository.findPendingInvitation(
        familyId,
        invitedUser?.id,
        email,
        username,
      );

    if (existingInvitation) {
      throw new AppException(
        ErrorCode.INVITATION_ALREADY_EXISTS,
        'A pending invitation already exists',
        HttpStatus.CONFLICT,
      );
    }

    const token =
      randomBytes(32).toString('hex');

    const expiresAt = new Date(
      Date.now() +
        7 * 24 * 60 * 60 * 1000,
    );

    const invitation =
      await this.invitationsRepository.createInvitation({
        familyId,
        invitedUserId: invitedUser?.id,
        invitedEmail: email,
        invitedUsername: username,
        invitedByUserId: currentUserId,
        role: 'parent',
        familyRole: 'other',
        token,
        expiresAt,
      });

    return {
      id: invitation.id,
      familyId: invitation.familyId,
      invitedUserId: invitation.invitedUserId,
      invitedEmail: invitation.invitedEmail,
      invitedUsername: invitation.invitedUsername,
      expiresAt: invitation.expiresAt,
      delivery: invitedUser
        ? 'in_app'
        : 'email',
    };
  }

  async getMyInvitations(userId: string) {
    return this.invitationsRepository.findPendingForUser(
      userId,
    );
  }

  async acceptInvitation(
    userId: string,
    invitationId: string,
  ) {
    const invitation =
      await this.invitationsRepository.findById(
        invitationId,
      );

    if (!invitation) {
      throw new AppException(
        ErrorCode.INVITATION_NOT_FOUND,
        'Invitation not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (invitation.acceptedAt) {
      throw new AppException(
        ErrorCode.INVITATION_ALREADY_ACCEPTED,
        'Invitation has already been accepted',
        HttpStatus.CONFLICT,
      );
    }

    if (invitation.rejectedAt) {
      throw new AppException(
        ErrorCode.INVITATION_ALREADY_REJECTED,
        'Invitation has already been rejected',
        HttpStatus.CONFLICT,
      );
    }

    if (invitation.expiresAt <= new Date()) {
      throw new AppException(
        ErrorCode.INVITATION_EXPIRED,
        'Invitation has expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (invitation.invitedUserId !== userId) {
      throw new AppException(
        ErrorCode.INVITATION_NOT_ALLOWED,
        'This invitation does not belong to you',
        HttpStatus.FORBIDDEN,
      );
    }

    const existingMember =
      await this.invitationsRepository.findFamilyMember(
        invitation.familyId,
        userId,
      );

    if (existingMember) {
      throw new AppException(
        ErrorCode.FAMILY_MEMBER_ALREADY_EXISTS,
        'You are already a member of this family',
        HttpStatus.CONFLICT,
      );
    }

    return this.invitationsRepository.acceptInvitation(
      invitation.id,
      userId,
      invitation.familyId,
      invitation.role,
      invitation.familyRole ?? undefined,
    );
  }

  async rejectInvitation(
    userId: string,
    invitationId: string,
  ) {
    const invitation =
      await this.invitationsRepository.findById(
        invitationId,
      );

    if (!invitation) {
      throw new AppException(
        ErrorCode.INVITATION_NOT_FOUND,
        'Invitation not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (invitation.invitedUserId !== userId) {
      throw new AppException(
        ErrorCode.INVITATION_NOT_ALLOWED,
        'This invitation does not belong to you',
        HttpStatus.FORBIDDEN,
      );
    }

    if (invitation.acceptedAt) {
      throw new AppException(
        ErrorCode.INVITATION_ALREADY_ACCEPTED,
        'Invitation has already been accepted',
        HttpStatus.CONFLICT,
      );
    }

    if (invitation.rejectedAt) {
      throw new AppException(
        ErrorCode.INVITATION_ALREADY_REJECTED,
        'Invitation has already been rejected',
        HttpStatus.CONFLICT,
      );
    }

    if (invitation.expiresAt <= new Date()) {
      throw new AppException(
        ErrorCode.INVITATION_EXPIRED,
        'Invitation has expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.invitationsRepository.rejectInvitation(
      invitation.id,
    );
  }
}