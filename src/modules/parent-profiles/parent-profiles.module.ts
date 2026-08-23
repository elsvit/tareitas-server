import { Module } from '@nestjs/common';

import { ParentProfilesService } from './parent-profiles.service';

@Module({
  providers: [ParentProfilesService],
  exports: [ParentProfilesService],
})
export class ParentProfilesModule {}
