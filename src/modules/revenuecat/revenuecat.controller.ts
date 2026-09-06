import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';

import { RevenueCatService } from './revenuecat.service';
import { RevenueCatWebhookGuard } from './revenuecat-webhook.guard';

type RevenueCatWebhookBody = {
  event?: Record<string, unknown>;
};

@Controller('api/revenuecat')
export class RevenueCatController {
  constructor(
    private readonly revenueCatService: RevenueCatService,
  ) {}

  @Post('webhook')
  @UseGuards(RevenueCatWebhookGuard)
  webhook(@Body() body: RevenueCatWebhookBody) {
    const event = (body.event ?? body) as Parameters<
      RevenueCatService['handleWebhookEvent']
    >[0];

    return this.revenueCatService.handleWebhookEvent(
      event,
    );
  }
}
