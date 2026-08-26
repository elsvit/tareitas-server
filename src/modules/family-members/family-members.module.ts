import { Module } from '@nestjs/common';

import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';

import { FamilyMembersController } from './family-members.controller';
import { FamilyMembersService } from './family-members.service';

@Module({
  imports: [AuthModule, CommonModule],
  controllers: [FamilyMembersController],
  providers: [FamilyMembersService],
})
export class FamilyMembersModule {}
