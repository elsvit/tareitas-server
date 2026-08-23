import { FamilyMember } from '../../generated/prisma/client';
import { JwtPayload } from '../../modules/auth/types/jwt-payload';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      familyMember?: FamilyMember;
    }
  }
}

export {};