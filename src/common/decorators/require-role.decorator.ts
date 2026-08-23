import { SetMetadata } from '@nestjs/common';

import { ERole } from '../../types/user';

export const ROLES_KEY = 'roles';

export const RequireRole = (...roles: ERole[]) =>
  SetMetadata(ROLES_KEY, roles);
