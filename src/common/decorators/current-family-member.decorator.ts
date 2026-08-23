import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

import { FamilyMember } from '../../generated/prisma/client';

export const CurrentFamilyMember =
  createParamDecorator(
    (
      _data: unknown,
      context: ExecutionContext,
    ): FamilyMember => {
      const request =
        context.switchToHttp().getRequest<Request>();

      return request.familyMember as FamilyMember;
    },
  );
