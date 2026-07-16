import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma/client.js";
import {
  buildProjectedCashFlow,
  type CashFlowGranularity,
  type CashFlowView,
  type ProjectedCashFlowResult,
  type ProjectedCashFlowTransaction,
} from "../../domain/financeiro/cash-flow.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DreRow {
  month: string; // ISO date string truncated to month (e.g. "2026-01-01")
  type: string;
  total: number;
}

export interface DreReport {
  year: number;
  rows: DreRow[];
  summary: {
    totalReceitas: number;
    totalDespesas: number;
    resultado: number;
  };
}

export interface CashFlowRow {
  period: string; // ISO date string
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface DashboardKpis {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  contasAVencer: number;
  contasVencidas: number;
  contasAReceber: number;
  contasReceberVencidas: number;
  contasPagasMes: number;
  contasRecebidasMes: number;
}

interface ProjectedCashFlowInput {
  granularity: CashFlowGranularity;
  view?: CashFlowView;
  dateFrom: Date;
  dateTo: Date;
  categoryId?: string | null;
  bank?: string;
}

function buildProjectedBalanceWhere(
  input: ProjectedCashFlowInput,
  type: "receita" | "despesa"
): Prisma.FinancialEntryWhereInput {
  const bank = input.bank?.trim();

  return {
    deletedAt: null,
    type,
    status: "confirmed",
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    ...(bank && bank !== "all"
      ? {
          OR: [
            { bankAccount: { contains: bank, mode: "insensitive" } },
            { notes: { contains: bank, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// DRE – aggregation by type and month
// ---------------------------------------------------------------------------

export async function getDre(year: number): Promise<DreReport> {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  const rows = await prisma.$queryRaw<Array<{ month: Date; type: string; total: string }>>`
    SELECT
      DATE_TRUNC('month', fe.date)::date AS month,
      fe.type,
      SUM(fe.amount)::text AS total
    FROM financial_entries fe
    WHERE fe.deleted_at IS NULL
      AND fe.status = 'confirmed'
      AND fe.date >= ${startDate}
      AND fe.date <= ${endDate}
    GROUP BY DATE_TRUNC('month', fe.date), fe.type
    ORDER BY month, fe.type
  `;

  const parsed: DreRow[] = rows.map((r) => ({
    month: r.month.toISOString().slice(0, 10),
    type: r.type,
    total: Number.parseFloat(r.total),
  }));

  const totalReceitas = parsed
    .filter((r) => r.type === "receita")
    .reduce((acc, r) => acc + r.total, 0);

  const totalDespesas = parsed
    .filter((r) => r.type === "despesa")
    .reduce((acc, r) => acc + r.total, 0);

  return {
    year,
    rows: parsed,
    summary: {
      totalReceitas,
      totalDespesas,
      resultado: totalReceitas - totalDespesas,
    },
  };
}

// ---------------------------------------------------------------------------
// Cash flow – daily / weekly / monthly
// ---------------------------------------------------------------------------

export async function getCashFlow(
  granularity: CashFlowGranularity,
  dateFrom: Date,
  dateTo: Date,
): Promise<CashFlowRow[]> {
  const trunc = granularity === "week" ? "week" : granularity;

  const rows = await prisma.$queryRaw<
    Array<{ period: Date; receitas: string; despesas: string; saldo: string }>
  >`
    SELECT
      grouped.period,
      COALESCE(SUM(CASE WHEN grouped.type = 'receita' THEN grouped.amount ELSE 0 END), 0)::text AS receitas,
      COALESCE(SUM(CASE WHEN grouped.type = 'despesa'  THEN grouped.amount ELSE 0 END), 0)::text AS despesas,
      COALESCE(SUM(CASE WHEN grouped.type = 'receita' THEN grouped.amount ELSE -grouped.amount END), 0)::text AS saldo
    FROM (
      SELECT DATE_TRUNC(${trunc}, fe.date)::date AS period, fe.type, fe.amount
      FROM financial_entries fe
      WHERE fe.deleted_at IS NULL
        AND fe.status = 'confirmed'
        AND fe.date >= ${dateFrom}
        AND fe.date <= ${dateTo}
    ) grouped
    GROUP BY grouped.period
    ORDER BY period
  `;

  return rows.map((r) => ({
    period: r.period.toISOString().slice(0, 10),
    receitas: Number.parseFloat(r.receitas),
    despesas: Number.parseFloat(r.despesas),
    saldo: Number.parseFloat(r.saldo),
  }));
}

export async function getProjectedCashFlow(input: ProjectedCashFlowInput): Promise<ProjectedCashFlowResult> {
  const [receitaAgg, despesaAgg, receivables, payables] = await Promise.all([
    prisma.financialEntry.aggregate({
      where: buildProjectedBalanceWhere(input, "receita"),
      _sum: { amount: true },
    }),
    prisma.financialEntry.aggregate({
      where: buildProjectedBalanceWhere(input, "despesa"),
      _sum: { amount: true },
    }),
    prisma.accountReceivable.findMany({
      where: {
        deletedAt: null,
        status: { in: ["pending", "overdue"] },
        dueDate: { gte: input.dateFrom, lte: input.dateTo },
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      },
      include: { category: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.accountPayable.findMany({
      where: {
        deletedAt: null,
        status: { in: ["pending", "overdue"] },
        dueDate: { gte: input.dateFrom, lte: input.dateTo },
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      },
      include: { category: true },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const today = new Date();
  const transactions: ProjectedCashFlowTransaction[] = [
    ...receivables.map((entry) => ({
      id: entry.id,
      type: "inflow" as const,
      description: entry.description,
      party: entry.client,
      amount: Number(entry.amount),
      dueDate: entry.dueDate.toISOString().slice(0, 10),
      status: "Previsto",
      categoryId: entry.categoryId,
      categoryName: entry.category?.name ?? null,
      overdue: entry.dueDate < today,
    })),
    ...payables.map((entry) => ({
      id: entry.id,
      type: "outflow" as const,
      description: entry.description,
      party: entry.beneficiaryName ?? entry.supplier,
      amount: Number(entry.amount),
      dueDate: entry.dueDate.toISOString().slice(0, 10),
      status: "Previsto",
      categoryId: entry.categoryId,
      categoryName: entry.category?.name ?? null,
      overdue: entry.dueDate < today,
    })),
  ];

  return buildProjectedCashFlow({
    initialBalance: Number(receitaAgg._sum.amount ?? 0) - Number(despesaAgg._sum.amount ?? 0),
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    granularity: input.granularity,
    view: input.view,
    categoryId: input.categoryId,
    bank: input.bank,
    transactions,
  });
}

// ---------------------------------------------------------------------------
// Dashboard KPIs
// ---------------------------------------------------------------------------

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [receitaAgg, despesaAgg] = await Promise.all([
    prisma.financialEntry.aggregate({
      where: {
        deletedAt: null,
        type: "receita",
        status: "confirmed",
      },
      _sum: { amount: true },
    }),
    prisma.financialEntry.aggregate({
      where: {
        deletedAt: null,
        type: "despesa",
        status: "confirmed",
      },
      _sum: { amount: true },
    }),
  ]);

  const [contasAVencer, contasVencidas, contasAReceber, contasReceberVencidas, contasPagasMes, contasRecebidasMes] =
    await Promise.all([
      prisma.accountPayable.count({
        where: {
          deletedAt: null,
          status: "pending",
          dueDate: { gte: now },
        },
      }),
      prisma.accountPayable.count({
        where: {
          deletedAt: null,
          status: "pending",
          dueDate: { lt: now },
        },
      }),
      prisma.accountReceivable.count({
        where: {
          deletedAt: null,
          status: "pending",
          dueDate: { gte: now },
        },
      }),
      prisma.accountReceivable.count({
        where: {
          deletedAt: null,
          status: "pending",
          dueDate: { lt: now },
        },
      }),
      prisma.accountPayable.count({
        where: {
          deletedAt: null,
          status: "paid",
          paidDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.accountReceivable.count({
        where: {
          deletedAt: null,
          status: "received",
          receivedDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
    ]);

  const totalReceitas = Number(receitaAgg._sum.amount ?? 0);
  const totalDespesas = Number(despesaAgg._sum.amount ?? 0);

  return {
    totalReceitas,
    totalDespesas,
    saldo: totalReceitas - totalDespesas,
    contasAVencer,
    contasVencidas,
    contasAReceber,
    contasReceberVencidas,
    contasPagasMes,
    contasRecebidasMes,
  };
}
