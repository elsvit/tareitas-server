import { Module } from '@nestjs/common';

import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { ParentProfilesModule } from '../parent-profiles/parent-profiles.module';
import { UploadsModule } from '../uploads/uploads.module';

import { FamiliesController } from './families.controller';
import { FamiliesRepository } from './families.repository';
import { FamiliesService } from './families.service';
import { PeriodMediaCleanupService } from './period-media-cleanup.service';

@Module({
  imports: [
    AuthModule,
    CommonModule,
    ParentProfilesModule,
    UploadsModule,
  ],
  controllers: [
    FamiliesController,
  ],
  providers: [
    FamiliesService,
    FamiliesRepository,
    PeriodMediaCleanupService,
  ],
})
export class FamiliesModule {}