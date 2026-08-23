import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './db/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { FamiliesModule } from './modules/families/families.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    FamiliesModule,
  ],
})
export class AppModule {}