import { Module } from '@nestjs/common';

import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { TasksController } from './tasks.controller';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    AuthModule,
    CommonModule,
    NotificationsModule,
  ],
  controllers: [TasksController],
  providers: [
    TasksService,
    TasksRepository,
  ],
})
export class TasksModule {}
