-- Drop legacy task tables
DROP TABLE IF EXISTS "public"."tasks";
DROP TABLE IF EXISTS "public"."recurring_tasks";

-- CreateTable
CREATE TABLE "public"."task_assignments" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "reward" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "picture" TEXT,
    "color" VARCHAR(50),
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "time" VARCHAR(5) NOT NULL DEFAULT '00:00',
    "is_habit" BOOLEAN NOT NULL DEFAULT false,
    "repeat" JSONB,
    "new_task_bonus" DECIMAL(10,2),
    "new_task_duration" INTEGER,
    "subtasks" JSONB,
    "changes" JSONB NOT NULL DEFAULT '{}',
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tasks" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "completed_subtasks" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_assignments_family_id_idx" ON "public"."task_assignments"("family_id");

-- CreateIndex
CREATE INDEX "task_assignments_child_id_idx" ON "public"."task_assignments"("child_id");

-- CreateIndex
CREATE INDEX "tasks_family_id_idx" ON "public"."tasks"("family_id");

-- CreateIndex
CREATE INDEX "tasks_assignment_id_idx" ON "public"."tasks"("assignment_id");

-- CreateIndex
CREATE INDEX "tasks_date_idx" ON "public"."tasks"("date");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "public"."tasks"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_assignment_id_date_unique" ON "public"."tasks"("assignment_id", "date");

-- AddForeignKey
ALTER TABLE "public"."task_assignments" ADD CONSTRAINT "task_assignments_family_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."task_assignments" ADD CONSTRAINT "task_assignments_child_fk" FOREIGN KEY ("child_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."task_assignments" ADD CONSTRAINT "task_assignments_created_by_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_family_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_assignment_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."task_assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
