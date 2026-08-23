import { Module } from '@nestjs/common';

import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';

import { RewardsController } from './rewards.controller';
import { RewardsRepository } from './rewards.repository';
import { RewardsService } from './rewards.service';

@Module({
  imports: [
    AuthModule,
    CommonModule,
  ],
  controllers: [RewardsController],
  providers: [
    RewardsService,
    RewardsRepository,
  ],
})
export class RewardsModule {}
