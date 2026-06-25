CREATE INDEX IF NOT EXISTS "financial_entries_deleted_at_date_idx"
  ON "financial_entries"("deleted_at", "date");

CREATE INDEX IF NOT EXISTS "financial_entries_deleted_at_type_date_idx"
  ON "financial_entries"("deleted_at", "type", "date");

CREATE INDEX IF NOT EXISTS "financial_entries_deleted_at_status_date_idx"
  ON "financial_entries"("deleted_at", "status", "date");

CREATE INDEX IF NOT EXISTS "accounts_payable_deleted_at_due_date_idx"
  ON "accounts_payable"("deleted_at", "due_date");

CREATE INDEX IF NOT EXISTS "accounts_payable_deleted_at_status_due_date_idx"
  ON "accounts_payable"("deleted_at", "status", "due_date");

CREATE INDEX IF NOT EXISTS "accounts_receivable_deleted_at_due_date_idx"
  ON "accounts_receivable"("deleted_at", "due_date");

CREATE INDEX IF NOT EXISTS "accounts_receivable_deleted_at_status_due_date_idx"
  ON "accounts_receivable"("deleted_at", "status", "due_date");
