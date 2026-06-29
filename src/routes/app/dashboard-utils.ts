import { toFiniteNumber } from "@/lib/utils";

export type ActivityStatus = "pending" | "completed" | "overdue" | "cancelled";

export const activityStatusMeta: Record<ActivityStatus, { label: string; className: string }> = {
  pending: {
    label: "Pendente",
    className: "bg-[color-mix(in_srgb,var(--color-pending)_12%,transparent)] text-[var(--color-pending)] ring-[color-mix(in_srgb,var(--color-pending)_20%,transparent)]",
  },
  completed: {
    label: "Concluido",
    className: "bg-[color-mix(in_srgb,var(--color-revenue)_12%,transparent)] text-[var(--color-revenue)] ring-[color-mix(in_srgb,var(--color-revenue)_20%,transparent)]",
  },
  overdue: {
    label: "Atrasado",
    className: "bg-[color-mix(in_srgb,var(--color-expense)_12%,transparent)] text-[var(--color-expense)] ring-[color-mix(in_srgb,var(--color-expense)_20%,transparent)]",
  },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground ring-border" },
};

export function getActivityStatusMeta(status: ActivityStatus) {
  return activityStatusMeta[status];
}

export function formatCompactMoney(value: unknown) {
  const amount = toFiniteNumber(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateFinancialPercentages(receitas: unknown, despesas: unknown, saldo: unknown) {
  const revenue = toFiniteNumber(receitas);
  const expense = toFiniteNumber(despesas);
  const balance = toFiniteNumber(saldo);
  const total = Math.max(revenue + expense, 1);
  return {
    receitaPercent: Number(((revenue / total) * 100).toFixed(1)),
    despesaPercent: Number(((expense / total) * 100).toFixed(1)),
    saldoPercent: Number((Math.min((Math.abs(balance) / total) * 100, 100)).toFixed(1)),
  };
}
