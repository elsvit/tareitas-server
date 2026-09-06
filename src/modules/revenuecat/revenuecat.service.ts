import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '../../db/prisma.service';

type RevenueCatWebhookEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  product_id?: string;
  entitlement_id?: string;
  entitlement_ids?: string[];
  store?: string;
  environment?: string;
  purchased_at_ms?: number | null;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number | null;
  auto_renew_status?: string | null;
  period_type?: string | null;
};

const DEFAULT_ENTITLEMENT_ID = 'tareitas_pro';

@Injectable()
export class RevenueCatService {
  private readonly logger = new Logger(
    RevenueCatService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async handleWebhookEvent(
    event: RevenueCatWebhookEvent,
  ) {
    this.logger.log(
      `RevenueCat webhook ${event.type ?? 'UNKNOWN'} (${event.id ?? 'no-id'}) app_user_id=${event.app_user_id ?? 'missing'}`,
    );

    if (
      event.type === 'SUBSCRIBER_ALIAS' ||
      event.type === 'TRANSFER'
    ) {
      return {
        success: true,
        ignored: true,
        reason: event.type,
      };
    }

    const familyId = event.app_user_id?.trim();

    if (!familyId) {
      this.logger.warn(
        'RevenueCat webhook missing app_user_id',
      );

      return { success: true, ignored: true };
    }

    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { id: true },
    });

    if (!family) {
      this.logger.warn(
        `RevenueCat webhook for unknown family ${familyId}`,
      );

      return { success: true, ignored: true };
    }

    const status = this.mapEventToStatus(event);
    const entitlementId =
      event.entitlement_ids?.[0] ??
      event.entitlement_id ??
      DEFAULT_ENTITLEMENT_ID;

    const purchasedAt = this.toDate(
      event.purchased_at_ms ?? event.event_timestamp_ms,
    );
    const expiresAt = this.toDate(event.expiration_at_ms);
    const willRenew =
      event.type === 'CANCELLATION'
        ? false
        : event.auto_renew_status?.toLowerCase() === 'true' ||
          event.auto_renew_status === '1';

    if (status === 'EXPIRED') {
      await this.prisma.familySubscription.updateMany({
        where: { familyId },
        data: {
          status,
          willRenew: false,
          expiresAt,
        },
      });

      return { success: true, familyId, status };
    }

    await this.prisma.familySubscription.upsert({
      where: { familyId },
      create: {
        familyId,
        entitlementId,
        productId: event.product_id ?? null,
        store: this.normalizeStore(event.store),
        status,
        willRenew,
        purchasedAt,
        expiresAt,
        revenueCatAppUserId: familyId,
      },
      update: {
        entitlementId,
        productId: event.product_id ?? undefined,
        store: this.normalizeStore(event.store) ?? undefined,
        status,
        willRenew,
        purchasedAt: purchasedAt ?? undefined,
        expiresAt,
      },
    });

    this.logger.log(
      `Updated family subscription for ${familyId} (${event.type} → ${status})`,
    );

    return {
      success: true,
      familyId,
      status,
    };
  }

  private mapEventToStatus(
    event: RevenueCatWebhookEvent,
  ): string {
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'NON_RENEWING_PURCHASE':
      case 'PRODUCT_CHANGE':
      case 'SUBSCRIPTION_EXTENDED':
        return 'ACTIVE';
      case 'CANCELLATION':
        return 'ACTIVE';
      case 'BILLING_ISSUE':
        return 'GRACE_PERIOD';
      case 'EXPIRATION':
        return 'EXPIRED';
      case 'SUBSCRIPTION_PAUSED':
        return 'PAUSED';
      case 'TEST':
        return 'ACTIVE';
      default:
        return 'ACTIVE';
    }
  }

  private normalizeStore(
    store?: string,
  ): string | null {
    if (!store) {
      return null;
    }

    return store.toUpperCase();
  }

  private toDate(
    value?: number | null,
  ): Date | null {
    if (value == null || Number.isNaN(value)) {
      return null;
    }

    return new Date(value);
  }
}
