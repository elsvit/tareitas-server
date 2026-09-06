import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RevenueCatService } from './revenuecat.service';
import { RevenueCatWebhookGuard } from './revenuecat-webhook.guard';

@Module({
  imports: [ConfigModule],
  providers: [
    RevenueCatService,
    RevenueCatWebhookGuard,
  ],
  exports: [
    RevenueCatService,
    RevenueCatWebhookGuard,
  ],
})
export class RevenueCatModule {}
