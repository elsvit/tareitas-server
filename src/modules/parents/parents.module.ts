import { Module } from '@nestjs/common';

import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';

import { ParentsController } from './parents.controller';
import { ParentsRepository } from './parents.repository';
import { ParentsService } from './parents.service';

@Module({
  imports: [AuthModule, CommonModule],
  controllers: [ParentsController],
  providers: [ParentsService, ParentsRepository],
})
export class ParentsModule {}
