import { Module } from '@nestjs/common';

import { RevenueCatModule } from '../revenuecat/revenuecat.module';
import { RevenueCatWebhookController } from './revenuecat-webhook.controller';

@Module({
  imports: [RevenueCatModule],
  controllers: [RevenueCatWebhookController],
})
export class WebhooksModule {}
