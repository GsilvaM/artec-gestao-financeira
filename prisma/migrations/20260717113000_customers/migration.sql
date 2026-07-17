CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customers_active_idx" ON "customers"("active");
CREATE INDEX "customers_deleted_at_name_idx" ON "customers"("deleted_at", "name");
CREATE INDEX "customers_document_idx" ON "customers"("document");
CREATE INDEX "customers_email_idx" ON "customers"("email");
CREATE INDEX "customers_user_id_idx" ON "customers"("user_id");
