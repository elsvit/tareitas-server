import { Module } from '@nestjs/common';

import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';

import { ChildrenController } from './children.controller';
import { ChildrenRepository } from './children.repository';
import { ChildrenService } from './children.service';

@Module({
  imports: [
    AuthModule,
    CommonModule,
  ],
  controllers: [ChildrenController],
  providers: [
    ChildrenService,
    ChildrenRepository,
  ],
})
export class ChildrenModule {}
