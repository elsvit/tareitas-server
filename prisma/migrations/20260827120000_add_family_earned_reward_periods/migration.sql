ALTER TABLE "public"."families"
ADD COLUMN "earned_reward_periods" JSONB NOT NULL DEFAULT '[]';
