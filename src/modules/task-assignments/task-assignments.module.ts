import { Module } from '@nestjs/common';

import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';

import { TaskAssignmentsController } from './task-assignments.controller';
import { TaskAssignmentsRepository } from './task-assignments.repository';
import { TaskAssignmentsService } from './task-assignments.service';

@Module({
  imports: [
    AuthModule,
    CommonModule,
  ],
  controllers: [TaskAssignmentsController],
  providers: [
    TaskAssignmentsService,
    TaskAssignmentsRepository,
  ],
  exports: [
    TaskAssignmentsService,
    TaskAssignmentsRepository,
  ],
})
export class TaskAssignmentsModule {}
