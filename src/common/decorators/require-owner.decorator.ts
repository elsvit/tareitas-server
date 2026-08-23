import { SetMetadata } from '@nestjs/common';

export const REQUIRE_OWNER_KEY = 'requireOwner';

export const RequireOwner = () =>
  SetMetadata(REQUIRE_OWNER_KEY, true);
