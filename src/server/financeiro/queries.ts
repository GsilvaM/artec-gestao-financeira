import { prisma } from "../../lib/prisma/client.js";

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

type CashFlowGranularity = "day" | "week" | "month";

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
        status: { in: ["pending", "confirmed"] },
      },
      _sum: { amount: true },
    }),
    prisma.financialEntry.aggregate({
      where: {
        deletedAt: null,
        type: "despesa",
        status: { in: ["pending", "confirmed"] },
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
