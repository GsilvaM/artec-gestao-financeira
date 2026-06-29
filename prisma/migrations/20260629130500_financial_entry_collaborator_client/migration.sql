ALTER TABLE "financial_entries"
  ADD COLUMN IF NOT EXISTS "collaborator_id" UUID,
  ADD COLUMN IF NOT EXISTS "client_name" TEXT;

CREATE INDEX IF NOT EXISTS "financial_entries_collaborator_id_idx"
  ON "financial_entries"("collaborator_id");

ALTER TABLE "financial_entries"
  ADD CONSTRAINT "financial_entries_collaborator_id_fkey"
  FOREIGN KEY ("collaborator_id") REFERENCES "collaborators"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
