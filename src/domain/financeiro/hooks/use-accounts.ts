import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  accountPayableKeys,
  accountReceivableKeys,
  cashFlowKeys,
  financialEntryKeys,
} from "../query-keys.js";
import { clientApi } from "@/server/financeiro/client-api";
import { toFiniteNumber } from "@/lib/utils";
import type {
  AccountPayableFilters,
  AccountReceivableFilters,
  AccountPayableRow,
  AccountPayableUpdate,
  AccountReceivableRow,
  AccountReceivableUpdate,
} from "../types.js";

const dashboardKey = ["dashboard"] as const;
const dreKey = ["dre"] as const;

type AccountPayableApiResponse = {
  id: string;
  description: string;
  amount: number | string;
  dueDate: string;
  paidDate: string | null;
  status: string;
  categoryId: string;
  category: { name: string; color: string | null } | null;
  costCenterId: string | null;
  costCenter: { name: string } | null;
  supplier: string | null;
  userId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type AccountReceivableApiResponse = Omit<
  AccountPayableApiResponse,
  "paidDate" | "supplier"
> & {
  receivedDate: string | null;
  client: string | null;
};

function toPayableRow(entry: AccountPayableApiResponse): AccountPayableRow {
  return {
    id: entry.id,
    description: entry.description,
    amount: toFiniteNumber(entry.amount),
    dueDate: entry.dueDate,
    paidDate: entry.paidDate,
    status: entry.status as AccountPayableRow["status"],
    categoryId: entry.categoryId,
    categoryName: entry.category?.name ?? "",
    categoryColor: entry.category?.color ?? null,
    costCenterId: entry.costCenterId,
    costCenterName: entry.costCenter?.name ?? null,
    supplier: entry.supplier,
    userId: entry.userId,
    notes: entry.notes,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function toReceivableRow(
  entry: AccountReceivableApiResponse
): AccountReceivableRow {
  return {
    id: entry.id,
    description: entry.description,
    amount: toFiniteNumber(entry.amount),
    dueDate: entry.dueDate,
    receivedDate: entry.receivedDate,
    status: entry.status as AccountReceivableRow["status"],
    categoryId: entry.categoryId,
    categoryName: entry.category?.name ?? "",
    categoryColor: entry.category?.color ?? null,
    costCenterId: entry.costCenterId,
    costCenterName: entry.costCenter?.name ?? null,
    client: entry.client,
    userId: entry.userId,
    notes: entry.notes,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

// ── Accounts Payable ───────────────────────────────────────────────────

export function useAccountsPayable(filters?: AccountPayableFilters) {
  return useQuery({
    queryKey: accountPayableKeys.list(filters),
    queryFn: async () => {
      const entries = (await clientApi.accountsPayable.findAll(
        filters as Record<string, unknown>
      )) as AccountPayableApiResponse[];
      return entries.map(toPayableRow);
    },
  });
}

export function useAccountPayable(id: string) {
  return useQuery({
    queryKey: accountPayableKeys.byId(id),
    queryFn: async () =>
      toPayableRow(
        (await clientApi.accountsPayable.findById(
          id
        )) as AccountPayableApiResponse
      ),
    enabled: !!id,
  });
}

export function useCreateAccountPayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => clientApi.accountsPayable.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountPayableKeys.all });
      void qc.invalidateQueries({ queryKey: dashboardKey });
    },
  });
}

export function useUpdateAccountPayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountPayableUpdate }) =>
      clientApi.accountsPayable.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountPayableKeys.all });
      void qc.invalidateQueries({ queryKey: dashboardKey });
    },
  });
}

export function usePayAccountPayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      clientApi.accountsPayable.pay(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountPayableKeys.all });
      void qc.invalidateQueries({ queryKey: financialEntryKeys.all });
      void qc.invalidateQueries({ queryKey: cashFlowKeys.all });
      void qc.invalidateQueries({ queryKey: dashboardKey });
      void qc.invalidateQueries({ queryKey: dreKey });
    },
  });
}

export function useReverseAccountPayablePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      clientApi.accountsPayable.reversePayment(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountPayableKeys.all });
      void qc.invalidateQueries({ queryKey: financialEntryKeys.all });
      void qc.invalidateQueries({ queryKey: cashFlowKeys.all });
      void qc.invalidateQueries({ queryKey: dashboardKey });
      void qc.invalidateQueries({ queryKey: dreKey });
    },
  });
}

export function useDeleteAccountPayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.accountsPayable.softDelete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountPayableKeys.all });
      void qc.invalidateQueries({ queryKey: dashboardKey });
    },
  });
}

// ── Accounts Receivable ────────────────────────────────────────────────

export function useAccountsReceivable(filters?: AccountReceivableFilters) {
  return useQuery({
    queryKey: accountReceivableKeys.list(filters),
    queryFn: async () => {
      const entries = (await clientApi.accountsReceivable.findAll(
        filters as Record<string, unknown>
      )) as AccountReceivableApiResponse[];
      return entries.map(toReceivableRow);
    },
  });
}

export function useAccountReceivable(id: string) {
  return useQuery({
    queryKey: accountReceivableKeys.byId(id),
    queryFn: async () =>
      toReceivableRow(
        (await clientApi.accountsReceivable.findById(
          id
        )) as AccountReceivableApiResponse
      ),
    enabled: !!id,
  });
}

export function useCreateAccountReceivable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => clientApi.accountsReceivable.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountReceivableKeys.all });
      void qc.invalidateQueries({ queryKey: dashboardKey });
    },
  });
}

export function useUpdateAccountReceivable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountReceivableUpdate }) =>
      clientApi.accountsReceivable.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountReceivableKeys.all });
      void qc.invalidateQueries({ queryKey: dashboardKey });
    },
  });
}

export function useReceiveAccountReceivable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      clientApi.accountsReceivable.receive(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountReceivableKeys.all });
      void qc.invalidateQueries({ queryKey: financialEntryKeys.all });
      void qc.invalidateQueries({ queryKey: cashFlowKeys.all });
      void qc.invalidateQueries({ queryKey: dashboardKey });
      void qc.invalidateQueries({ queryKey: dreKey });
    },
  });
}

export function useReverseAccountReceivableReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      clientApi.accountsReceivable.reverseReceipt(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountReceivableKeys.all });
      void qc.invalidateQueries({ queryKey: financialEntryKeys.all });
      void qc.invalidateQueries({ queryKey: cashFlowKeys.all });
      void qc.invalidateQueries({ queryKey: dashboardKey });
      void qc.invalidateQueries({ queryKey: dreKey });
    },
  });
}

export function useDeleteAccountReceivable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.accountsReceivable.softDelete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountReceivableKeys.all });
      void qc.invalidateQueries({ queryKey: dashboardKey });
    },
  });
}
