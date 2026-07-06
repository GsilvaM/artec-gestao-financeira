import { toFiniteNumber } from "@/lib/utils";

export type FinancialEntryLike = {
  amount: unknown;
  type: "receita" | "despesa" | string;
  status?: string | null;
  description?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  costCenterId?: string | null;
  date?: string | Date | null;
};

export type FinancialEntryFiltersLike = {
  type?: "receita" | "despesa";
  status?: string;
  categoryId?: string;
  costCenterId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type FinancialSummary = {
  receitas: number;
  despesas: number;
  saldo: number;
  total: number;
};

export function sumAmounts(entries: Array<{ amount: unknown }>): number {
  return roundCurrency(entries.reduce((sum, entry) => sum + toFiniteNumber(entry.amount), 0));
}

export function calculateFinancialSummary(entries: FinancialEntryLike[]): FinancialSummary {
  const realizedEntries = entries.filter(
    (entry) => entry.status === undefined || entry.status === "confirmed"
  );
  const receitas = sumAmounts(realizedEntries.filter((entry) => entry.type === "receita"));
  const despesas = sumAmounts(realizedEntries.filter((entry) => entry.type === "despesa"));

  return {
    receitas,
    despesas,
    saldo: roundCurrency(receitas - despesas),
    total: realizedEntries.length,
  };
}

export function filterFinancialEntries<T extends FinancialEntryLike>(
  entries: T[],
  filters: FinancialEntryFiltersLike = {},
): T[] {
  const search = filters.search?.trim().toLowerCase();

  return entries.filter((entry) => {
    if (filters.type && entry.type !== filters.type) return false;
    if (filters.status && entry.status !== filters.status) return false;
    if (filters.categoryId && entry.categoryId !== filters.categoryId) return false;
    if (filters.costCenterId && entry.costCenterId !== filters.costCenterId) return false;

    const entryDate = parseEntryDate(entry.date);
    if (filters.dateFrom && (!entryDate || entryDate < startOfDay(filters.dateFrom))) return false;
    if (filters.dateTo && (!entryDate || entryDate > endOfDay(filters.dateTo))) return false;

    if (!search) return true;

    const text = [entry.description, entry.categoryName, entry.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(search);
  });
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseEntryDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value + (value.includes("T") ? "" : "T00:00:00"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}
