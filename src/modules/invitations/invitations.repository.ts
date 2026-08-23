import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class InvitationsRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  findUserByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: {
        username,
      },
    });
  }

  findFamilyMember(
    familyId: string,
    userId: string,
  ) {
    return this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId,
          userId,
        },
      },
    });
  }

  findPendingInvitation(
    familyId: string,
    userId?: string,
    email?: string,
    username?: string,
  ) {
    return this.prisma.invitation.findFirst({
      where: {
        familyId,
        acceptedAt: null,
        rejectedAt: null,
        expiresAt: {
          gt: new Date(),
        },
        OR: [
          ...(userId
            ? [{ invitedUserId: userId }]
            : []),
          ...(email
            ? [{ invitedEmail: email }]
            : []),
          ...(username
            ? [{ invitedUsername: username }]
            : []),
        ],
      },
    });
  }

  createInvitation(data: {
    familyId: string;
    invitedUserId?: string;
    invitedEmail?: string;
    invitedUsername?: string;
    invitedByUserId: string;
    role: string;
    familyRole?: string;
    token: string;
    expiresAt: Date;
  }) {
    return this.prisma.invitation.create({
      data,
    });
  }

  findPendingForUser(userId: string) {
    return this.prisma.invitation.findMany({
      where: {
        invitedUserId: userId,
        acceptedAt: null,
        rejectedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        familyId: true,
        invitedUserId: true,
        invitedEmail: true,
        invitedUsername: true,
        invitedByUserId: true,
        role: true,
        familyRole: true,
        expiresAt: true,
        acceptedAt: true,
        rejectedAt: true,
        createdAt: true,
        family: true,
        invitedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findById(id: string) {
    return this.prisma.invitation.findUnique({
      where: {
        id,
      },
      include: {
        family: true,
      },
    });
  }

  acceptInvitation(
    invitationId: string,
    userId: string,
    familyId: string,
    role: string,
    familyRole?: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const familyMember =
          await tx.familyMember.create({
            data: {
              familyId,
              userId,
              role,
              familyRole,
            },
          });

        const invitation =
          await tx.invitation.update({
            where: {
              id: invitationId,
            },
            data: {
              acceptedAt: new Date(),
            },
          });

        return {
          familyMember,
          invitation,
        };
      },
    );
  }

  rejectInvitation(invitationId: string) {
    return this.prisma.invitation.update({
      where: {
        id: invitationId,
      },
      data: {
        rejectedAt: new Date(),
      },
    });
  }
}