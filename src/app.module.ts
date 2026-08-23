import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './db/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { FamiliesModule } from './modules/families/families.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { ChildrenModule } from './modules/children/children.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    FamiliesModule,
    InvitationsModule,
    ChildrenModule,
    TasksModule,
    RewardsModule,
    NotificationsModule,
  ],
})
export class AppModule {}