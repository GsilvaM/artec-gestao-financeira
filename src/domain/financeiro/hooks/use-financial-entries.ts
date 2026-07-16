import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { cashFlowKeys, financialEntryKeys } from '../query-keys.js';
import { clientApi } from '@/server/financeiro/client-api';
import { toFiniteNumber } from '@/lib/utils';
import type { FinancialEntryRow, FinancialEntryFilters, FinancialEntryPageResult, FinancialEntryUpdate } from '../types.js';

type EntryApiResponse = {
  id: string;
  description: string;
  amount: number;
  grossAmount: number | null;
  discountAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  type: string;
  date: string;
  status: string;
  categoryId: string;
  category: { name: string; color: string | null } | null;
  costCenterId: string | null;
  costCenter: { name: string } | null;
  collaboratorId: string | null;
  collaborator: { name: string } | null;
  clientName: string | null;
  paymentMethod: string | null;
  bankAccount: string | null;
  originType: string | null;
  originId: string | null;
  reversalOfFinancialEntryId: string | null;
  userId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const financialEntryListKey = [...financialEntryKeys.all, 'list'] as const;
const dashboardKey = ['dashboard'] as const;

function invalidateFinancialSummaries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: dashboardKey });
  void qc.invalidateQueries({ queryKey: cashFlowKeys.all });
  void qc.invalidateQueries({ queryKey: financialEntryListKey });
}

function toRow(e: EntryApiResponse): FinancialEntryRow {
  return {
    id: e.id,
    description: e.description,
    amount: toFiniteNumber(e.amount),
    grossAmount: e.grossAmount === null ? null : toFiniteNumber(e.grossAmount),
    discountAmount: toFiniteNumber(e.discountAmount),
    interestAmount: toFiniteNumber(e.interestAmount),
    penaltyAmount: toFiniteNumber(e.penaltyAmount),
    type: e.type as FinancialEntryRow['type'],
    date: e.date,
    status: e.status as FinancialEntryRow['status'],
    categoryId: e.categoryId,
    categoryName: e.category?.name ?? '',
    categoryColor: e.category?.color ?? null,
    costCenterId: e.costCenterId,
    costCenterName: e.costCenter?.name ?? null,
    collaboratorId: e.collaboratorId,
    collaboratorName: e.collaborator?.name ?? null,
    clientName: e.clientName ?? null,
    paymentMethod: e.paymentMethod ?? null,
    bankAccount: e.bankAccount ?? null,
    originType: e.originType ?? null,
    originId: e.originId ?? null,
    reversalOfFinancialEntryId: e.reversalOfFinancialEntryId ?? null,
    userId: e.userId,
    notes: e.notes,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

export function useFinancialEntries(
  filters?: FinancialEntryFilters,
): UseQueryResult<FinancialEntryRow[]>;
export function useFinancialEntries(
  filters: FinancialEntryFilters | undefined,
  pagination: { page: number; pageSize: number },
): UseQueryResult<FinancialEntryPageResult>;
export function useFinancialEntries(
  filters?: FinancialEntryFilters,
  pagination?: { page: number; pageSize: number }
) {
  return useQuery<FinancialEntryRow[] | FinancialEntryPageResult>({
    queryKey: financialEntryKeys.list(filters, pagination),
    queryFn: async () => {
      if (pagination) {
        const result = (await clientApi.financialEntries.findPage(
          filters as Record<string, unknown>,
          pagination.page,
          pagination.pageSize
        )) as {
          items: EntryApiResponse[];
          pagination: FinancialEntryPageResult['pagination'];
          summary: FinancialEntryPageResult['summary'];
        };

        return {
          items: result.items.map(toRow),
          pagination: result.pagination,
          summary: result.summary,
        };
      }

      const entries = (await clientApi.financialEntries.findAll(filters as Record<string, unknown>)) as EntryApiResponse[];
      return entries.map(toRow);
    },
  });
}

export function useFinancialEntry(id: string) {
  return useQuery({
    queryKey: financialEntryKeys.byId(id),
    queryFn: async () => {
      const entry = (await clientApi.financialEntries.findById(id)) as EntryApiResponse;
      return toRow(entry);
    },
    enabled: !!id,
  });
}

export function useCreateFinancialEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => clientApi.financialEntries.create(data),
    onSuccess: (created) => {
      const row = toRow(created as EntryApiResponse);
      qc.setQueriesData<FinancialEntryRow[]>({ queryKey: financialEntryListKey }, (old) => (
        Array.isArray(old) ? [row, ...old.filter((item) => item.id !== row.id)] : old
      ));
      invalidateFinancialSummaries(qc);
    },
  });
}

export function useUpdateFinancialEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FinancialEntryUpdate }) =>
      clientApi.financialEntries.update(id, data),
    onSuccess: (updated) => {
      const row = toRow(updated as EntryApiResponse);
      qc.setQueryData(financialEntryKeys.byId(row.id), row);
      qc.setQueriesData<FinancialEntryRow[]>({ queryKey: financialEntryListKey }, (old) => (
        Array.isArray(old) ? old.map((item) => item.id === row.id ? row : item) : old
      ));
      invalidateFinancialSummaries(qc);
    },
  });
}

export function useDeleteFinancialEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.financialEntries.softDelete(id),
    onSuccess: (_deleted, id) => {
      qc.removeQueries({ queryKey: financialEntryKeys.byId(id) });
      qc.setQueriesData<FinancialEntryRow[]>({ queryKey: financialEntryListKey }, (old) => (
        Array.isArray(old) ? old.filter((item) => item.id !== id) : old
      ));
      invalidateFinancialSummaries(qc);
    },
  });
}
