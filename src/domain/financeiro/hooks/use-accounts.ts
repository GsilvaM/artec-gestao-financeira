import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountPayableKeys, accountReceivableKeys } from '../query-keys';
import { clientApi } from '@/server/financeiro/client-api';
import type { AccountPayableFilters, AccountReceivableFilters, AccountPayableUpdate, AccountReceivableUpdate } from '../types';

// ── Accounts Payable ───────────────────────────────────────────────────

export function useAccountsPayable(filters?: AccountPayableFilters) {
  return useQuery({
    queryKey: accountPayableKeys.list(filters),
      queryFn: () => clientApi.accountsPayable.findAll(filters as Record<string, unknown>),
  });
}

export function useAccountPayable(id: string) {
  return useQuery({
    queryKey: accountPayableKeys.byId(id),
    queryFn: () => clientApi.accountsPayable.findById(id),
    enabled: !!id,
  });
}

export function useCreateAccountPayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => clientApi.accountsPayable.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountPayableKeys.all }),
  });
}

export function useUpdateAccountPayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountPayableUpdate }) =>
      clientApi.accountsPayable.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountPayableKeys.all }),
  });
}

export function useDeleteAccountPayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.accountsPayable.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountPayableKeys.all }),
  });
}

// ── Accounts Receivable ────────────────────────────────────────────────

export function useAccountsReceivable(filters?: AccountReceivableFilters) {
  return useQuery({
    queryKey: accountReceivableKeys.list(filters),
      queryFn: () => clientApi.accountsReceivable.findAll(filters as Record<string, unknown>),
  });
}

export function useAccountReceivable(id: string) {
  return useQuery({
    queryKey: accountReceivableKeys.byId(id),
    queryFn: () => clientApi.accountsReceivable.findById(id),
    enabled: !!id,
  });
}

export function useCreateAccountReceivable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => clientApi.accountsReceivable.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountReceivableKeys.all }),
  });
}

export function useUpdateAccountReceivable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountReceivableUpdate }) =>
      clientApi.accountsReceivable.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountReceivableKeys.all }),
  });
}

export function useDeleteAccountReceivable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.accountsReceivable.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountReceivableKeys.all }),
  });
}
