import type { z } from 'zod';
import {
  financialEntrySchema,
  financialEntryUpdateSchema,
  accountPayableSchema,
  accountPayableUpdateSchema,
  accountReceivableSchema,
  accountReceivableUpdateSchema,
  categorySchema,
  categoryUpdateSchema,
  costCenterSchema,
  costCenterUpdateSchema,
  collaboratorSchema,
  collaboratorUpdateSchema,
  financialEntryFilterSchema,
  accountPayableFilterSchema,
  accountReceivableFilterSchema,
  categoryFilterSchema,
  costCenterFilterSchema,
  collaboratorFilterSchema,
} from './schemas.js';

// ── Inferred from Zod schemas ────────────────────────────────────────

export type FinancialEntryCreate = z.infer<typeof financialEntrySchema>;
export type FinancialEntryUpdate = z.infer<typeof financialEntryUpdateSchema>;

export type AccountPayableCreate = z.infer<typeof accountPayableSchema>;
export type AccountPayableUpdate = z.infer<typeof accountPayableUpdateSchema>;

export type AccountReceivableCreate = z.infer<typeof accountReceivableSchema>;
export type AccountReceivableUpdate = z.infer<typeof accountReceivableUpdateSchema>;

export type CategoryCreate = z.infer<typeof categorySchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;

export type CostCenterCreate = z.infer<typeof costCenterSchema>;
export type CostCenterUpdate = z.infer<typeof costCenterUpdateSchema>;
export type CollaboratorCreate = z.infer<typeof collaboratorSchema>;
export type CollaboratorUpdate = z.infer<typeof collaboratorUpdateSchema>;

export type FinancialEntryFilters = z.infer<typeof financialEntryFilterSchema>;
export type AccountPayableFilters = z.infer<typeof accountPayableFilterSchema>;
export type AccountReceivableFilters = z.infer<typeof accountReceivableFilterSchema>;
export type CategoryFilters = z.infer<typeof categoryFilterSchema>;
export type CostCenterFilters = z.infer<typeof costCenterFilterSchema>;
export type CollaboratorFilters = z.infer<typeof collaboratorFilterSchema>;
export type AccountPayableBeneficiaryType = 'supplier' | 'collaborator';

// ── Row / query result types ─────────────────────────────────────────

export interface FinancialEntryRow {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'reversed';
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  costCenterId: string | null;
  costCenterName: string | null;
  collaboratorId: string | null;
  collaboratorName: string | null;
  clientName: string | null;
  userId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountPayableRow {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'reversed';
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  costCenterId: string | null;
  costCenterName: string | null;
  supplier: string | null;
  beneficiaryType: AccountPayableBeneficiaryType;
  beneficiaryId: string | null;
  beneficiaryName: string | null;
  userId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountReceivableRow {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  receivedDate: string | null;
  status: 'pending' | 'received' | 'overdue' | 'cancelled' | 'reversed';
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  costCenterId: string | null;
  costCenterName: string | null;
  client: string | null;
  userId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  type: 'receita' | 'despesa';
  color: string | null;
  entryCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenterRow {
  id: string;
  name: string;
  code: string | null;
  active: boolean;
  entryCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollaboratorRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Date range utility ───────────────────────────────────────────────

export interface DateRange {
  from: Date;
  to: Date;
}

// ── DRE (Demonstração do Resultado do Exercício) ─────────────────────

export interface DREEntry {
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  type: 'receita' | 'despesa';
  amount: number;
  percentage: number;
}

export interface DREOverview {
  totalRevenue: number;
  totalExpenses: number;
  netResult: number;
  netResultPercentage: number;
  entries: DREEntry[];
}

// ── Cash Flow ────────────────────────────────────────────────────────

export interface CashFlowEntry {
  period: string;
  inflows: number;
  outflows: number;
  balance: number;
  cumulativeBalance: number;
}

export interface CashFlowOverview {
  entries: CashFlowEntry[];
  totalInflows: number;
  totalOutflows: number;
  finalBalance: number;
}
