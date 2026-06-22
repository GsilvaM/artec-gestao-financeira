import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialEntryKeys } from '../query-keys';
import { clientApi } from '@/server/financeiro/client-api';
import type { FinancialEntryRow, FinancialEntryFilters, FinancialEntryUpdate } from '../types';

type EntryApiResponse = {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  status: string;
  categoryId: string;
  category: { name: string; color: string | null } | null;
  costCenterId: string | null;
  costCenter: { name: string } | null;
  userId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function toRow(e: EntryApiResponse): FinancialEntryRow {
  return {
    id: e.id,
    description: e.description,
    amount: e.amount,
    type: e.type as FinancialEntryRow['type'],
    date: e.date,
    status: e.status as FinancialEntryRow['status'],
    categoryId: e.categoryId,
    categoryName: e.category?.name ?? '',
    categoryColor: e.category?.color ?? null,
    costCenterId: e.costCenterId,
    costCenterName: e.costCenter?.name ?? null,
    userId: e.userId,
    notes: e.notes,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

export function useFinancialEntries(filters?: FinancialEntryFilters) {
  return useQuery({
    queryKey: financialEntryKeys.list(filters),
    queryFn: async () => {
      const entries: EntryApiResponse[] = await clientApi.financialEntries.findAll(filters as Record<string, unknown>);
      return entries.map(toRow);
    },
  });
}

export function useFinancialEntry(id: string) {
  return useQuery({
    queryKey: financialEntryKeys.byId(id),
    queryFn: async () => {
      const entry: EntryApiResponse = await clientApi.financialEntries.findById(id);
      return toRow(entry);
    },
    enabled: !!id,
  });
}

export function useCreateFinancialEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => clientApi.financialEntries.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financialEntryKeys.all }),
  });
}

export function useUpdateFinancialEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FinancialEntryUpdate }) =>
      clientApi.financialEntries.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financialEntryKeys.all }),
  });
}

export function useDeleteFinancialEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.financialEntries.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financialEntryKeys.all }),
  });
}
