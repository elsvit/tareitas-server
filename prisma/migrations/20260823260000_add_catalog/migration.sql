-- Family catalog revision counters
ALTER TABLE "public"."families"
  ADD COLUMN "task_base_revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "reward_base_revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "bundled_task_catalog_version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "bundled_reward_catalog_version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."task_base_items" (
    "id" VARCHAR(100) NOT NULL,
    "family_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "reward" DECIMAL(10,2),
    "picture" TEXT,
    "time" VARCHAR(5),
    "color" VARCHAR(50),
    "subtasks" JSONB,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "source" VARCHAR(20) NOT NULL DEFAULT 'custom',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_base_items_pkey" PRIMARY KEY ("family_id","id")
);

-- CreateTable
CREATE TABLE "public"."reward_base_items" (
    "id" VARCHAR(100) NOT NULL,
    "family_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "reward" DECIMAL(10,2) NOT NULL,
    "picture" TEXT,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "source" VARCHAR(20) NOT NULL DEFAULT 'custom',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_base_items_pkey" PRIMARY KEY ("family_id","id")
);

-- CreateIndex
CREATE INDEX "task_base_items_family_id_idx" ON "public"."task_base_items"("family_id");

-- CreateIndex
CREATE INDEX "reward_base_items_family_id_idx" ON "public"."reward_base_items"("family_id");

-- AddForeignKey
ALTER TABLE "public"."task_base_items" ADD CONSTRAINT "task_base_items_family_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."reward_base_items" ADD CONSTRAINT "reward_base_items_family_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
