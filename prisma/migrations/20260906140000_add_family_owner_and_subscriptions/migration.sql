-- Enforce one admin owner per family at the Family level (RevenueCat identity anchor).
ALTER TABLE "families" ADD COLUMN "owner_user_id" UUID;

UPDATE "families" AS f
SET "owner_user_id" = owner_member.user_id
FROM (
  SELECT DISTINCT ON (fm.family_id)
    fm.family_id,
    fm.user_id
  FROM "family_members" AS fm
  WHERE fm.is_owner = true
  ORDER BY fm.family_id, fm.created_at ASC
) AS owner_member
WHERE f.id = owner_member.family_id;

DELETE FROM "families"
WHERE "owner_user_id" IS NULL;

ALTER TABLE "families"
  ALTER COLUMN "owner_user_id" SET NOT NULL;

ALTER TABLE "families"
  ADD CONSTRAINT "families_owner_user_fk"
  FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

CREATE UNIQUE INDEX "families_owner_user_id_unique" ON "families"("owner_user_id");

-- One subscription record per family; one RevenueCat customer per family.
CREATE TABLE "family_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "entitlement_id" VARCHAR(100) NOT NULL,
    "product_id" VARCHAR(255),
    "store" VARCHAR(50),
    "status" VARCHAR(30) NOT NULL,
    "will_renew" BOOLEAN NOT NULL DEFAULT false,
    "purchased_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "revenuecat_app_user_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "family_subscriptions_family_id_key" ON "family_subscriptions"("family_id");
CREATE UNIQUE INDEX "family_subscriptions_revenuecat_app_user_id_key" ON "family_subscriptions"("revenuecat_app_user_id");
CREATE INDEX "family_subscriptions_status_idx" ON "family_subscriptions"("status");
CREATE INDEX "family_subscriptions_expires_at_idx" ON "family_subscriptions"("expires_at");

ALTER TABLE "family_subscriptions"
  ADD CONSTRAINT "family_subscriptions_family_fk"
  FOREIGN KEY ("family_id") REFERENCES "families"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
