CREATE TABLE "account_deletion_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code_hash" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_deletion_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "account_deletion_codes_user_id_idx" ON "account_deletion_codes"("user_id");

ALTER TABLE "account_deletion_codes" ADD CONSTRAINT "account_deletion_codes_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
