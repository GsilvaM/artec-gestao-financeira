import { z } from 'zod';
import {
  ENTRY_TYPES,
  ENTRY_STATUS,
  ACCOUNT_PAYABLE_STATUS,
  ACCOUNT_RECEIVABLE_STATUS,
  CATEGORY_TYPES,
} from './constants.js';

const uuidField = z.string().uuid();

const dateField = z.coerce.date();

const positiveDecimal = z.preprocess(
  (v) => {
    if (typeof v !== 'string') return v;
    const input = v.trim();
    const normalized = input.includes(',') ? input.replace(/\./g, '').replace(',', '.') : input;
    return normalized ? Number(normalized) : undefined;
  },
  z.number().positive().multipleOf(0.01),
);

const nonNegativeDecimal = z.preprocess(
  (v) => {
    if (typeof v !== 'string') return v;
    const input = v.trim();
    const normalized = input.includes(',') ? input.replace(/\./g, '').replace(',', '.') : input;
    return normalized ? Number(normalized) : undefined;
  },
  z.number().min(0).multipleOf(0.01),
);

// ── Financial Entry ──────────────────────────────────────────────────

export const financialEntryCreateSchema = z.object({
  description: z.string().min(1),
  type: z.enum(["receita", "despesa"]),
  amount: positiveDecimal,
  grossAmount: positiveDecimal.nullable().optional(),
  discountAmount: nonNegativeDecimal.default(0),
  interestAmount: nonNegativeDecimal.default(0),
  penaltyAmount: nonNegativeDecimal.default(0),
  date: z.coerce.date(),
  status: z.enum(["pending", "confirmed", "cancelled", "reversed"]).default("pending"),
  categoryId: uuidField,
  costCenterId: uuidField.optional(),
  collaboratorId: uuidField.nullable().optional(),
  clientName: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  bankAccount: z.string().nullable().optional(),
  originType: z.enum(["manual", "accounts_payable", "accounts_receivable", "import", "system", "reversal"]).nullable().optional(),
  originId: z.string().nullable().optional(),
  reversalOfFinancialEntryId: uuidField.nullable().optional(),
  notes: z.string().optional(),
});

export const financialEntrySchema = financialEntryCreateSchema;
export const financialEntryUpdateSchema = financialEntryCreateSchema.partial();

// ── Account Payable ──────────────────────────────────────────────────

export const accountPayableCreateSchema = z.object({
  description: z.string().min(1),
  amount: positiveDecimal,
  dueDate: z.coerce.date(),
  status: z.enum(["pending", "cancelled", "paid", "overdue", "reversed"]).default("pending"),
  paidDate: z.coerce.date().optional(),
  beneficiaryType: z.enum(["supplier", "collaborator"]).default("supplier"),
  beneficiaryId: uuidField.nullable().optional(),
  beneficiaryName: z.string().nullable().optional(),
  supplier: z.string().optional(),
  categoryId: uuidField,
  costCenterId: uuidField.optional(),
  notes: z.string().optional(),
});

export const accountPayableSchema = accountPayableCreateSchema;
export const accountPayableUpdateSchema = accountPayableCreateSchema.partial();

// ── Account Receivable ───────────────────────────────────────────────

export const accountReceivableCreateSchema = z.object({
  description: z.string().min(1),
  amount: positiveDecimal,
  dueDate: z.coerce.date(),
  status: z.enum(["received", "pending", "cancelled", "overdue", "reversed"]).default("pending"),
  receivedDate: z.coerce.date().optional(),
  client: z.string().optional(),
  categoryId: uuidField,
  costCenterId: uuidField.optional(),
  notes: z.string().optional(),
});

export const accountReceivableSchema = accountReceivableCreateSchema;
export const accountReceivableUpdateSchema = accountReceivableCreateSchema.partial();

// ── Category ─────────────────────────────────────────────────────────

export const categoryCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["receita", "despesa"]),
  color: z.string().optional(),
});

export const categorySchema = categoryCreateSchema;
export const categoryUpdateSchema = categoryCreateSchema.partial();

// ── Cost Center ──────────────────────────────────────────────────────

export const costCenterCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  active: z.boolean().default(true),
});

export const costCenterSchema = costCenterCreateSchema;
export const costCenterUpdateSchema = costCenterCreateSchema.partial();

// ── Filter schemas ───────────────────────────────────────────────────

export const financialEntryFilterSchema = z.object({
  type: z.enum([ENTRY_TYPES.RECEITA, ENTRY_TYPES.DESPESA]).optional(),
  status: z
    .enum([
      ENTRY_STATUS.PENDING,
      ENTRY_STATUS.CONFIRMED,
      ENTRY_STATUS.CANCELLED,
      ENTRY_STATUS.REVERSED,
    ])
    .optional(),
  categoryId: uuidField.optional(),
  costCenterId: uuidField.optional(),
  collaboratorId: uuidField.optional(),
  paymentMethod: z.string().optional(),
  bankAccount: z.string().optional(),
  origin: z
    .enum([
      "manual",
      "accounts_payable",
      "accounts_receivable",
      "import",
      "system",
      "reversal",
    ])
    .optional(),
  dateFrom: dateField.optional(),
  dateTo: dateField.optional(),
  search: z.string().optional(),
});

export const accountPayableFilterSchema = z.object({
  status: z
    .enum([
      ACCOUNT_PAYABLE_STATUS.PENDING,
      ACCOUNT_PAYABLE_STATUS.PAID,
      ACCOUNT_PAYABLE_STATUS.OVERDUE,
      ACCOUNT_PAYABLE_STATUS.CANCELLED,
      ACCOUNT_PAYABLE_STATUS.REVERSED,
    ])
    .optional(),
  categoryId: uuidField.optional(),
  costCenterId: uuidField.optional(),
  beneficiaryType: z.enum(["supplier", "collaborator"]).optional(),
  beneficiaryId: uuidField.optional(),
  dueDateFrom: dateField.optional(),
  dueDateTo: dateField.optional(),
  search: z.string().optional(),
});

export const accountReceivableFilterSchema = z.object({
  status: z
    .enum([
      ACCOUNT_RECEIVABLE_STATUS.PENDING,
      ACCOUNT_RECEIVABLE_STATUS.RECEIVED,
      ACCOUNT_RECEIVABLE_STATUS.OVERDUE,
      ACCOUNT_RECEIVABLE_STATUS.CANCELLED,
      ACCOUNT_RECEIVABLE_STATUS.REVERSED,
    ])
    .optional(),
  categoryId: uuidField.optional(),
  costCenterId: uuidField.optional(),
  dueDateFrom: dateField.optional(),
  dueDateTo: dateField.optional(),
  search: z.string().optional(),
});

export const categoryFilterSchema = z.object({
  type: z.enum([CATEGORY_TYPES.RECEITA, CATEGORY_TYPES.DESPESA]).optional(),
  search: z.string().optional(),
});

export const costCenterFilterSchema = z.object({
  includeInactive: z.boolean().optional(),
  search: z.string().optional(),
});

export const collaboratorCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
  active: z.boolean().default(true),
});

export const collaboratorSchema = collaboratorCreateSchema;
export const collaboratorUpdateSchema = collaboratorCreateSchema.partial();

export const collaboratorFilterSchema = z.object({
  includeInactive: z.boolean().optional(),
  search: z.string().optional(),
});
