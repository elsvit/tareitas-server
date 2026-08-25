-- CreateTable
CREATE TABLE "public"."recurring_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "assigned_to_user_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "points" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "frequency" VARCHAR(20) NOT NULL,
    "days_of_week" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "day_of_month" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "next_run_at" TIMESTAMPTZ(6) NOT NULL,
    "last_run_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_tasks_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN "recurring_task_id" UUID;

-- CreateIndex
CREATE INDEX "tasks_recurring_task_id_idx" ON "public"."tasks"("recurring_task_id");

-- CreateIndex
CREATE INDEX "recurring_tasks_family_id_idx" ON "public"."recurring_tasks"("family_id");

-- CreateIndex
CREATE INDEX "recurring_tasks_is_active_next_run_at_idx" ON "public"."recurring_tasks"("is_active", "next_run_at");

-- AddForeignKey
ALTER TABLE "public"."recurring_tasks" ADD CONSTRAINT "recurring_tasks_family_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."recurring_tasks" ADD CONSTRAINT "recurring_tasks_assigned_to_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."recurring_tasks" ADD CONSTRAINT "recurring_tasks_created_by_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_recurring_task_fk" FOREIGN KEY ("recurring_task_id") REFERENCES "public"."recurring_tasks"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
