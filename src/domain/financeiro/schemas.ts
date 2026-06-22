import { z } from 'zod';
import {
  ENTRY_TYPES,
  ENTRY_STATUS,
  ACCOUNT_PAYABLE_STATUS,
  ACCOUNT_RECEIVABLE_STATUS,
  CATEGORY_TYPES,
} from './constants';

const uuidField = z.string({ message: 'ID inválido' }).uuid('ID deve ser um UUID válido');

const descriptionField = z
  .string({ required_error: 'Descrição é obrigatória' })
  .min(1, 'Descrição é obrigatória');

const positiveDecimal = z
  .number({ required_error: 'Valor é obrigatório', invalid_type_error: 'Valor deve ser numérico' })
  .positive('Valor deve ser positivo')
  .multipleOf(0.01, 'Valor deve ter no máximo 2 casas decimais');

const dateField = z.date({ required_error: 'Data é obrigatória' });

const notesField = z.string().optional();

// ── Financial Entry ──────────────────────────────────────────────────

export const financialEntrySchema = z.object({
  description: descriptionField,
  amount: positiveDecimal,
  type: z.enum([ENTRY_TYPES.RECEITA, ENTRY_TYPES.DESPESA], {
    required_error: 'Tipo é obrigatório',
    message: 'Tipo deve ser receita ou despesa',
  }),
  date: dateField,
  status: z
    .enum([ENTRY_STATUS.PENDING, ENTRY_STATUS.CONFIRMED, ENTRY_STATUS.CANCELLED], {
      message: 'Status inválido',
    })
    .default(ENTRY_STATUS.PENDING),
  categoryId: uuidField,
  costCenterId: uuidField.optional(),
  notes: notesField,
});

export const financialEntryUpdateSchema = financialEntrySchema.partial();

// ── Account Payable ──────────────────────────────────────────────────

export const accountPayableSchema = z.object({
  description: descriptionField,
  amount: positiveDecimal,
  dueDate: dateField,
  paidDate: z.date().optional(),
  status: z
    .enum(
      [
        ACCOUNT_PAYABLE_STATUS.PENDING,
        ACCOUNT_PAYABLE_STATUS.PAID,
        ACCOUNT_PAYABLE_STATUS.OVERDUE,
        ACCOUNT_PAYABLE_STATUS.CANCELLED,
      ],
      { message: 'Status inválido' },
    )
    .default(ACCOUNT_PAYABLE_STATUS.PENDING),
  categoryId: uuidField,
  costCenterId: uuidField.optional(),
  supplier: z.string().optional(),
  notes: notesField,
});

export const accountPayableUpdateSchema = accountPayableSchema.partial();

// ── Account Receivable ───────────────────────────────────────────────

export const accountReceivableSchema = z.object({
  description: descriptionField,
  amount: positiveDecimal,
  dueDate: dateField,
  receivedDate: z.date().optional(),
  status: z
    .enum(
      [
        ACCOUNT_RECEIVABLE_STATUS.PENDING,
        ACCOUNT_RECEIVABLE_STATUS.RECEIVED,
        ACCOUNT_RECEIVABLE_STATUS.OVERDUE,
        ACCOUNT_RECEIVABLE_STATUS.CANCELLED,
      ],
      { message: 'Status inválido' },
    )
    .default(ACCOUNT_RECEIVABLE_STATUS.PENDING),
  categoryId: uuidField,
  costCenterId: uuidField.optional(),
  client: z.string().optional(),
  notes: notesField,
});

export const accountReceivableUpdateSchema = accountReceivableSchema.partial();

// ── Category ─────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(1, 'Nome é obrigatório'),
  type: z.enum([CATEGORY_TYPES.RECEITA, CATEGORY_TYPES.DESPESA], {
    required_error: 'Tipo é obrigatório',
    message: 'Tipo deve ser receita ou despesa',
  }),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser um hexadecimal válido (#RRGGBB)')
    .optional(),
});

export const categoryUpdateSchema = categorySchema.partial();

// ── Cost Center ──────────────────────────────────────────────────────

export const costCenterSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(1, 'Nome é obrigatório'),
  code: z.string().optional(),
  active: z.boolean().default(true),
});

export const costCenterUpdateSchema = costCenterSchema.partial();

// ── Filter schemas ───────────────────────────────────────────────────

export const financialEntryFilterSchema = z.object({
  type: z.enum([ENTRY_TYPES.RECEITA, ENTRY_TYPES.DESPESA]).optional(),
  status: z
    .enum([ENTRY_STATUS.PENDING, ENTRY_STATUS.CONFIRMED, ENTRY_STATUS.CANCELLED])
    .optional(),
  categoryId: uuidField.optional(),
  costCenterId: uuidField.optional(),
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
    ])
    .optional(),
  categoryId: uuidField.optional(),
  costCenterId: uuidField.optional(),
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
  active: z.boolean().optional(),
  search: z.string().optional(),
});
