import { Module } from '@nestjs/common';

import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { ParentProfilesModule } from '../parent-profiles/parent-profiles.module';

import { FamiliesController } from './families.controller';
import { FamiliesRepository } from './families.repository';
import { FamiliesService } from './families.service';

@Module({
  imports: [
    AuthModule,
    CommonModule,
    ParentProfilesModule,
  ],
  controllers: [
    FamiliesController,
  ],
  providers: [
    FamiliesService,
    FamiliesRepository,
  ],
})
export class FamiliesModule {}