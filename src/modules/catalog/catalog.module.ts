import { Module } from '@nestjs/common';

import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';

import { CatalogController } from './catalog.controller';
import { CatalogRepository } from './catalog.repository';
import { CatalogService } from './catalog.service';

@Module({
  imports: [AuthModule, CommonModule],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    CatalogRepository,
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
