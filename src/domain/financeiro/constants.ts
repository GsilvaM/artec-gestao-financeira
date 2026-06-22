export const ENTRY_TYPES = {
  RECEITA: 'receita',
  DESPESA: 'despesa',
} as const;

export const ENTRY_TYPE_LABELS = {
  receita: 'Receita',
  despesa: 'Despesa',
} as const;

export const ENTRY_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const;

export const ENTRY_STATUS_LABELS = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
} as const;

export const ACCOUNT_PAYABLE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export const ACCOUNT_PAYABLE_STATUS_LABELS = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
} as const;

export const ACCOUNT_RECEIVABLE_STATUS = {
  PENDING: 'pending',
  RECEIVED: 'received',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export const ACCOUNT_RECEIVABLE_STATUS_LABELS = {
  pending: 'Pendente',
  received: 'Recebido',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
} as const;

export const CATEGORY_TYPES = {
  RECEITA: 'receita',
  DESPESA: 'despesa',
} as const;

export type EntryType = (typeof ENTRY_TYPES)[keyof typeof ENTRY_TYPES];
export type EntryStatus = (typeof ENTRY_STATUS)[keyof typeof ENTRY_STATUS];
export type AccountPayableStatus = (typeof ACCOUNT_PAYABLE_STATUS)[keyof typeof ACCOUNT_PAYABLE_STATUS];
export type AccountReceivableStatus = (typeof ACCOUNT_RECEIVABLE_STATUS)[keyof typeof ACCOUNT_RECEIVABLE_STATUS];
export type CategoryType = (typeof CATEGORY_TYPES)[keyof typeof CATEGORY_TYPES];
