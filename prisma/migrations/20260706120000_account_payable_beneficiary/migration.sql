-- Add polymorphic beneficiary data to accounts payable while preserving
-- the legacy supplier column for compatibility with existing integrations.
ALTER TABLE "accounts_payable"
  ADD COLUMN "beneficiary_type" TEXT NOT NULL DEFAULT 'supplier',
  ADD COLUMN "beneficiary_id" UUID,
  ADD COLUMN "beneficiary_name" TEXT;

UPDATE "accounts_payable"
SET "beneficiary_name" = NULLIF(BTRIM("supplier"), '')
WHERE "beneficiary_name" IS NULL;

-- Auto-convert accounts whose supplier matches an active collaborator.
-- This links existing supplier-only accounts to the collaborator record
-- so they show as "Colaborador" in the UI and generate financial entries
-- with collaboratorId on payment.
UPDATE "accounts_payable" ap
SET
  "beneficiary_type" = 'collaborator',
  "beneficiary_id" = c.id,
  "beneficiary_name" = c.name,
  "supplier" = NULL
FROM "collaborators" c
WHERE ap."deleted_at" IS NULL
  AND c."deleted_at" IS NULL
  AND c."active" = TRUE
  AND ap."beneficiary_type" = 'supplier'
  AND NULLIF(BTRIM(ap."supplier"), '') IS NOT NULL
  AND LOWER(BTRIM(ap."supplier")) = LOWER(BTRIM(c."name"));

CREATE INDEX "accounts_payable_beneficiary_type_idx"
  ON "accounts_payable"("beneficiary_type");

CREATE INDEX "accounts_payable_beneficiary_id_idx"
  ON "accounts_payable"("beneficiary_id");

CREATE INDEX "accounts_payable_deleted_at_beneficiary_type_due_date_idx"
  ON "accounts_payable"("deleted_at", "beneficiary_type", "due_date");

-- Default expense categories used by internal collaborator payments.
INSERT INTO "categories" ("id", "name", "type", "color", "created_at", "updated_at")
SELECT gen_random_uuid(), category_name, 'despesa', category_color, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  VALUES
    ('Salários', '#2563eb'),
    ('Pró-labore', '#7c3aed'),
    ('Férias', '#0891b2'),
    ('Décimo Terceiro', '#0f766e'),
    ('Comissões', '#db2777'),
    ('Benefícios', '#16a34a'),
    ('Encargos Trabalhistas', '#ea580c'),
    ('Reembolsos', '#64748b')
) AS seed(category_name, category_color)
WHERE NOT EXISTS (
  SELECT 1
  FROM "categories"
  WHERE "categories"."deleted_at" IS NULL
    AND LOWER("categories"."name") = LOWER(seed.category_name)
    AND "categories"."type" = 'despesa'
);
