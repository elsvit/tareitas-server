import { FamilyMember } from '../../generated/prisma/client';
import { JwtPayload } from '../../modules/auth/types/jwt-payload';
import { SupportedLang } from '../../i18n/supported-langs';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      familyMember?: FamilyMember;
      lang?: SupportedLang;
    }
  }
}

export {};