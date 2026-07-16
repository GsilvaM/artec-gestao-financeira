ALTER TABLE "financial_entries"
  ADD COLUMN "gross_amount" DECIMAL(12, 2),
  ADD COLUMN "discount_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "interest_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "penalty_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "payment_method" TEXT,
  ADD COLUMN "bank_account" TEXT,
  ADD COLUMN "origin_type" TEXT,
  ADD COLUMN "origin_id" TEXT,
  ADD COLUMN "reversal_of_financial_entry_id" UUID;

UPDATE "financial_entries"
SET
  "origin_type" = COALESCE(
    "origin_type",
    NULLIF(substring("notes" from '\[originType=([^;\]]+);'), '')
  ),
  "origin_id" = COALESCE(
    "origin_id",
    NULLIF(substring("notes" from 'originId=([^\]]+)\]'), '')
  ),
  "payment_method" = COALESCE(
    "payment_method",
    NULLIF(substring("notes" from 'Forma de pagamento: ([^\n\r]+)'), ''),
    NULLIF(substring("notes" from 'Forma de recebimento: ([^\n\r]+)'), '')
  ),
  "bank_account" = COALESCE(
    "bank_account",
    NULLIF(substring("notes" from 'Conta/Banco: ([^\n\r]+)'), '')
  ),
  "reversal_of_financial_entry_id" = COALESCE(
    "reversal_of_financial_entry_id",
    NULLIF(substring("notes" from '\[reversalOfFinancialEntryId=([0-9a-fA-F-]{36})\]'), '')::uuid
  )
WHERE "notes" IS NOT NULL;

CREATE INDEX "financial_entries_payment_method_idx"
  ON "financial_entries"("payment_method");

CREATE INDEX "financial_entries_bank_account_idx"
  ON "financial_entries"("bank_account");

CREATE INDEX "financial_entries_origin_type_origin_id_idx"
  ON "financial_entries"("origin_type", "origin_id");

CREATE INDEX "financial_entries_reversal_of_financial_entry_id_idx"
  ON "financial_entries"("reversal_of_financial_entry_id");
