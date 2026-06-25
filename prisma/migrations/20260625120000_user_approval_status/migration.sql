ALTER TABLE "profiles"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "approved_by" UUID,
ADD COLUMN IF NOT EXISTS "rejected_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rejected_by" UUID;

CREATE INDEX IF NOT EXISTS "profiles_status_idx" ON "profiles"("status");
CREATE INDEX IF NOT EXISTS "profiles_role_id_idx" ON "profiles"("role_id");

INSERT INTO "roles" ("id", "name", "description", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'primary_admin', 'Administrador principal - aprova acessos e gerencia administradores', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'user', 'Usuario padrao aprovado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
