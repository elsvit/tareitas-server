import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RevenueCatController } from './revenuecat.controller';
import { RevenueCatService } from './revenuecat.service';
import { RevenueCatWebhookGuard } from './revenuecat-webhook.guard';

@Module({
  imports: [ConfigModule],
  controllers: [RevenueCatController],
  providers: [
    RevenueCatService,
    RevenueCatWebhookGuard,
  ],
  exports: [RevenueCatService],
})
export class RevenueCatModule {}
