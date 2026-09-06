import { FamilySubscription } from '../../generated/prisma/client';

export type FamilySubscriptionResponse = {
  subscriptionId: string;
  entitlementId: string;
  productId: string | null;
  store: string | null;
  status: string;
  isPro: boolean;
  willRenew: boolean;
  purchasedAt: string | null;
  expiresAt: string | null;
  revenueCatAppUserId: string;
};

export function isFamilySubscriptionPro(
  subscription: Pick<
    FamilySubscription,
    'status' | 'expiresAt'
  >,
  now = new Date(),
): boolean {
  const activeStatuses = new Set([
    'ACTIVE',
    'GRACE_PERIOD',
  ]);

  if (!activeStatuses.has(subscription.status)) {
    return false;
  }

  if (!subscription.expiresAt) {
    return true;
  }

  return subscription.expiresAt > now;
}

export function toFamilySubscriptionResponse(
  subscription: FamilySubscription | null | undefined,
): FamilySubscriptionResponse | null {
  if (!subscription) {
    return null;
  }

  return {
    subscriptionId: subscription.id,
    entitlementId: subscription.entitlementId,
    productId: subscription.productId,
    store: subscription.store,
    status: subscription.status,
    isPro: isFamilySubscriptionPro(subscription),
    willRenew: subscription.willRenew,
    purchasedAt:
      subscription.purchasedAt?.toISOString() ?? null,
    expiresAt:
      subscription.expiresAt?.toISOString() ?? null,
    revenueCatAppUserId:
      subscription.revenueCatAppUserId,
  };
}
