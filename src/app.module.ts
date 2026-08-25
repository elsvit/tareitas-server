import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './db/prisma.module';
import { I18nModule } from './i18n/i18n.module';
import { HttpExceptionFilter } from './common/errors/http-exception.filter';
import { LangInterceptor } from './common/interceptors/lang.interceptor';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { FamiliesModule } from './modules/families/families.module';
import { ChildrenModule } from './modules/children/children.module';
import { ParentsModule } from './modules/parents/parents.module';
import { TaskAssignmentsModule } from './modules/task-assignments/task-assignments.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { CatalogModule } from './modules/catalog/catalog.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    I18nModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    FamiliesModule,
    ChildrenModule,
    ParentsModule,
    TaskAssignmentsModule,
    TasksModule,
    RewardsModule,
    NotificationsModule,
    UploadsModule,
    CatalogModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LangInterceptor,
    },
  ],
})
export class AppModule {}
