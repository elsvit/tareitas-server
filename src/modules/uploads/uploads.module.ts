import { Module } from '@nestjs/common';

import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';

import { ObjectStorageService } from './object-storage.service';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [AuthModule, CommonModule],
  controllers: [UploadsController],
  providers: [UploadsService, ObjectStorageService],
  exports: [UploadsService],
})
export class UploadsModule {}
