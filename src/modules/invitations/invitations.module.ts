import { Module } from '@nestjs/common';

import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { ParentProfilesModule } from '../parent-profiles/parent-profiles.module';

import { InvitationsController } from './invitations.controller';
import { InvitationsRepository } from './invitations.repository';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [
    AuthModule,
    CommonModule,
    ParentProfilesModule,
  ],
  controllers: [
    InvitationsController,
  ],
  providers: [
    InvitationsService,
    InvitationsRepository,
  ],
  exports: [
    InvitationsService,
  ],
})
export class InvitationsModule {}