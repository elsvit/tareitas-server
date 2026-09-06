import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';

import { RevenueCatService } from '../revenuecat/revenuecat.service';
import { RevenueCatWebhookGuard } from '../revenuecat/revenuecat-webhook.guard';

type RevenueCatWebhookBody = {
  event?: Record<string, unknown>;
};

@Controller('api/webhooks')
export class RevenueCatWebhookController {
  constructor(
    private readonly revenueCatService: RevenueCatService,
  ) {}

  @Post('revenuecat')
  @UseGuards(RevenueCatWebhookGuard)
  revenuecat(@Body() body: RevenueCatWebhookBody) {
    const event = (body.event ?? body) as Parameters<
      RevenueCatService['handleWebhookEvent']
    >[0];

    return this.revenueCatService.handleWebhookEvent(
      event,
    );
  }
}
