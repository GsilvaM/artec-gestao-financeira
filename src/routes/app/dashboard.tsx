import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileBarChart,
  Filter,
  Plus,
  ReceiptText,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SparklineChart } from "@/components/dashboard/SparklineChart";
import { useAccountsPayable } from "@/domain/financeiro/hooks/use-accounts";
import { useCashFlow } from "@/domain/financeiro/hooks/use-cash-flow";
import { useDashboardKpis } from "@/domain/financeiro/hooks/use-dashboard-kpis";
import { useFinancialEntries } from "@/domain/financeiro/hooks/use-financial-entries";
import type {
  AccountPayableRow,
  FinancialEntryRow,
} from "@/domain/financeiro/types";
import { cn, formatMoney, getMoneyToneClass, toFiniteNumber } from "@/lib/utils";
import { formatCompactMoney } from "./dashboard-utils.js";
import { EmptyState, pageHeaderStyles } from "@/components/layout/page-shell";

type ChartSeries = "receitas" | "despesas" | "saldo";
type DashboardPeriod = "3m" | "6m" | "12m";

type FinancialChartPoint = {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number | null;
};

type CashFlowApiRow = {
  period?: unknown;
  receitas?: unknown;
  despesas?: unknown;
  saldo?: unknown;
};

function useDataTimeout(isLoading: boolean, timeoutMs = 5_000) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }
    const timeout = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [isLoading, timeoutMs]);
  return timedOut;
}

function getDashboardCashFlowRange(referenceDate = new Date(), months = 6) {
  const start = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() - (months - 1),
    1
  );
  const end = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return { start, end };
}

const dashboardPeriodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "3m", label: "Últimos 3 meses" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "12m", label: "Últimos 12 meses" },
];

const dashboardSeriesOptions: Array<{ value: ChartSeries | "all"; label: string }> = [
  { value: "all", label: "Todas as series" },
  { value: "receitas", label: "Receitas" },
  { value: "despesas", label: "Despesas" },
  { value: "saldo", label: "Saldo" },
];

function getDashboardPeriodMonths(period: DashboardPeriod) {
  return period === "3m" ? 3 : period === "12m" ? 12 : 6;
}

function getDashboardPeriodLabel(period: DashboardPeriod) {
  return dashboardPeriodOptions.find((option) => option.value === period)?.label ?? "Últimos 6 meses";
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  const label = date
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildFinancialChartData(
  rows: CashFlowApiRow[] | undefined,
  start: Date,
  months = 6
): FinancialChartPoint[] {
  const totalsByMonth = new Map<string, Omit<FinancialChartPoint, "mes">>();
  for (const row of rows ?? []) {
    if (!row.period) continue;
    const period = new Date(String(row.period));
    if (Number.isNaN(period.getTime())) continue;
    totalsByMonth.set(monthKey(period), {
      receitas: toFiniteNumber(row.receitas),
      despesas: toFiniteNumber(row.despesas),
      saldo: toFiniteNumber(row.saldo),
    });
  }
  const monthlyData = Array.from({ length: months }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    const current = totalsByMonth.get(monthKey(date));
    if (!current || (current.receitas === 0 && current.despesas === 0 && current.saldo === 0)) {
      return { mes: monthLabel(date), receitas: 0, despesas: 0, saldo: null };
    }
    return { mes: monthLabel(date), ...current };
  });
  let accumulatedBalance = 0;
  return monthlyData.map((item) => {
    if (item.saldo === null) return item;
    accumulatedBalance += item.saldo;
    return { ...item, saldo: accumulatedBalance };
  });
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

function getPayableDisplayStatus(entry: AccountPayableRow) {
  if (entry.status !== "pending" && entry.status !== "overdue") return entry.status;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return entry.dueDate.slice(0, 10) < todayKey ? "overdue" : entry.status;
}

function DeltaBadge({ value, qualifier }: { value?: number; qualifier?: string }) {
  if (typeof value !== "number" || value === 0) {
    return (
      <span className="text-text-muted text-xs font-medium">
        Sem dados do mês anterior
      </span>
    );
  }
  const positive = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-bold",
        positive ? "text-success" : "text-danger"
      )}
    >
      {positive ? (
        <ArrowUpCircle className="size-3.5" />
      ) : (
        <ArrowDownCircle className="size-3.5" />
      )}
      {qualifier ? `${qualifier} ` : positive ? "+" : ""}
      {Math.abs(value).toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}
      %
    </span>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  tone,
  delta,
  sparklineData,
  deltaQualifier,
  valueClassName,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone: "green" | "blue" | "orange";
  delta?: number;
  sparklineData: number[];
  deltaQualifier?: string;
  valueClassName?: string;
}) {
  const iconColors: Record<string, string> = {
    green: "bg-success-soft text-success",
    blue: "bg-primary-soft text-primary",
    orange: "bg-warning-soft text-warning",
  };
  const sparklineColor = tone === "orange" ? "red" : tone;

  return (
    <section className="metric-card card-hover">
      <div className="min-w-0">
        <div className={cn("metric-icon", iconColors[tone])}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="metric-title">{title}</p>
          <strong className={cn("metric-value", valueClassName)}>{value}</strong>
        </div>
      </div>
      <div>
        <div className="metric-trend">
          <DeltaBadge value={delta} qualifier={deltaQualifier} />
          {delta !== undefined ? <small>vs. mês anterior</small> : null}
        </div>
        <div className="metric-sparkline mt-2 h-10">
          <SparklineChart
            data={sparklineData.length ? sparklineData : [0, 0, 0, 0, 0, 0]}
            color={sparklineColor}
          />
        </div>
      </div>
    </section>
  );
}

function PendingKpiCard({
  total,
  overdue,
}: {
  total: number;
  overdue: number;
}) {
  const hasPending = total > 0;
  return (
    <section className="metric-card card-hover">
      <div>
        <div className="metric-icon bg-purple-soft text-purple">
          <Bell />
        </div>
        <div>
          <p className="metric-title">Pendências</p>
          <strong className="metric-value">{hasPending ? total : "0"}</strong>
        </div>
      </div>
      <div>
        <p
          className={cn(
            "flex items-center gap-1.5 text-sm font-bold",
            hasPending ? "text-warning" : "text-success"
          )}
        >
          <CheckCircle2 className="size-4" />
          {hasPending ? `${overdue} vencidas` : "Tudo em dia"}
        </p>
        <p className="text-text-secondary mt-1 text-xs">
          {hasPending
            ? "Revise as contas pendentes no financeiro."
            : "Todas as contas estão dentro do prazo."}
        </p>
      </div>
    </section>
  );
}

type ChartPayload = {
  payload?: { receitas: number; despesas: number; saldo: number | null; mes: string };
};

function FinancialTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartPayload[];
}) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  return (
    <div className="border-border bg-surface text-text-primary shadow-card rounded-2xl border p-3 text-xs">
      <p className="text-text-primary mb-2 font-bold">{item.mes}</p>
      <div className="space-y-1.5">
        <p className="flex items-center justify-between gap-8">
          <span className="text-text-secondary">Receitas</span>
          <strong className="text-success">{formatMoney(item.receitas)}</strong>
        </p>
        <p className="flex items-center justify-between gap-8">
          <span className="text-text-secondary">Despesas</span>
          <strong className="text-danger">{formatMoney(item.despesas)}</strong>
        </p>
        <p className="flex items-center justify-between gap-8">
          <span className="text-text-secondary">Saldo</span>
          <strong className="text-primary">{formatMoney(item.saldo ?? 0)}</strong>
        </p>
      </div>
    </div>
  );
}

function ChartLegend({
  hiddenSeries,
  onToggle,
}: {
  hiddenSeries: Record<ChartSeries, boolean>;
  onToggle: (series: ChartSeries) => void;
}) {
  const items: { id: ChartSeries; label: string; className: string }[] = [
    { id: "receitas", label: "Receitas", className: "bg-chart-revenue" },
    { id: "despesas", label: "Despesas", className: "bg-chart-expense" },
    { id: "saldo", label: "Saldo", className: "bg-chart-balance" },
  ];
  return (
    <div className="chart-legend">
      {items.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggle(item.id)}
          className={cn(
            "px-3 [&_span]:shrink-0",
            hiddenSeries[item.id] && "opacity-45"
          )}
          aria-pressed={!hiddenSeries[item.id]}
        >
          <span
            className={cn(
              item.id === "saldo" ? "legend-line" : "legend-dot",
              item.className
            )}
          />
          {item.label}
        </Button>
      ))}
    </div>
  );
}

function FinancialHeroCard({
  balance,
  revenue,
  expenses,
}: {
  balance: number;
  revenue: number;
  expenses: number;
}) {
  return (
    <section className="financial-hero-card">
      <div className="financial-hero-glow" aria-hidden="true" />
      <div className="financial-hero-header">
        <div>
          <h2>Cartão financeiro</h2>
          <p>Resumo do caixa financeiro.</p>
        </div>
        <span className="financial-hero-status">Ativo</span>
      </div>
      <div className="financial-hero-body">
        <p className="financial-company">Artec Gestão</p>
        <p className="financial-label">CONTA FINANCEIRA</p>
        <p className="financial-balance-label">Saldo atual</p>
        <strong className="financial-balance">{formatMoney(balance)}</strong>
      </div>
      <div className="financial-hero-footer">
        <div>
          <span className="financial-mini-label financial-income">
            Receitas
          </span>
          <strong>{formatMoney(revenue)}</strong>
        </div>
        <div>
          <span className="financial-mini-label financial-expense">
            Despesas
          </span>
          <strong>{formatMoney(expenses)}</strong>
        </div>
      </div>
    </section>
  );
}

function QuickActionsCard({
  onNavigate,
}: {
  onNavigate: (to: string) => void;
}) {
  const actions = [
    {
      label: "Novo lançamento",
      description: "Registre receita ou despesa",
      icon: Plus,
      to: "/app/financeiro/lancamentos",
      tone: "purple" as const,
    },
    {
      label: "Nova conta a pagar",
      description: "Adicione conta para pagamento",
      icon: CreditCard,
      to: "/app/financeiro/contas-pagar",
      tone: "blue" as const,
    },
    {
      label: "Emitir relatório",
      description: "Gere relatórios financeiros",
      icon: FileBarChart,
      to: "/app/relatorios",
      tone: "green" as const,
    },
  ];

  return (
    <section className="quick-actions-card">
      <h2>Atalhos rápidos</h2>
      <div className="quick-actions-list">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              type="button"
              variant="secondary"
              onClick={() => onNavigate(action.to)}
              className="quick-action-card"
            >
              <div className="quick-action-left">
                <div
                  className={`quick-action-icon quick-action-icon-${action.tone}`}
                >
                  <Icon />
                </div>
                <div>
                  <strong>{action.label}</strong>
                  <p>{action.description}</p>
                </div>
              </div>
              <ChevronRight className="quick-action-chevron" />
            </Button>
          );
        })}
      </div>
    </section>
  );
}

function RecentMovementsTable({
  entries,
  onViewAll,
}: {
  entries: FinancialEntryRow[];
  onViewAll: () => void;
}) {
  const rows = entries.slice(0, 4);
  return (
    <section className="table-card">
      <div className="table-card-header">
        <h2>Últimas movimentações</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary font-bold"
          onClick={onViewAll}
        >
          Ver todas
        </Button>
      </div>
      {rows.length ? (
        <>
          <div className="dashboard-table-desktop">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((entry) => {
                  const receita = entry.type === "receita";
                  return (
                    <TableRow key={entry.id}>
                      <TableCell
                        className="max-w-[280px] truncate font-medium"
                        title={entry.description}
                      >
                        {entry.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={receita ? "success" : "warning"}>
                          {entry.categoryName ||
                            (receita ? "Receita" : "Despesa")}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-medium",
                          receita ? "text-success" : "text-danger"
                        )}
                      >
                        {receita ? "Receita" : "Despesa"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-bold",
                          receita ? "text-success" : "text-danger"
                        )}
                      >
                        {formatMoney(entry.amount)}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {formatDate(entry.date)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="dashboard-mobile-list">
            {rows.map((entry) => {
              const receita = entry.type === "receita";
              return (
                <article key={entry.id} className="dashboard-mobile-record">
                  <div className="dashboard-mobile-record-top">
                    <div className="min-w-0">
                      <h3 className="truncate" title={entry.description}>{entry.description}</h3>
                      <p>{formatDate(entry.date)}</p>
                    </div>
                    <strong
                      className={cn(receita ? "text-success" : "text-danger")}
                    >
                      {formatMoney(entry.amount)}
                    </strong>
                  </div>
                  <div className="dashboard-mobile-record-bottom">
                    <Badge variant={receita ? "success" : "warning"}>
                      {entry.categoryName || (receita ? "Receita" : "Despesa")}
                    </Badge>
                    <span
                      className={cn(receita ? "text-success" : "text-danger")}
                    >
                      {receita ? "Receita" : "Despesa"}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState
          title="Nenhuma movimentação encontrada."
          description="Os lançamentos recentes aparecem aqui assim que forem cadastrados."
        />
      )}
    </section>
  );
}
function AccountsPayableTable({
  entries,
  onViewAll,
}: {
  entries: AccountPayableRow[];
  onViewAll: () => void;
}) {
  const sorted = [...entries]
    .sort((a, b) => {
      const priority = (status: string) => status === "overdue" ? 0 : status === "pending" ? 1 : status === "paid" ? 2 : 3;
      return priority(getPayableDisplayStatus(a)) - priority(getPayableDisplayStatus(b)) || a.dueDate.localeCompare(b.dueDate);
    });
  const pendingRows = sorted.filter((e) => {
    const s = getPayableDisplayStatus(e);
    return s === "overdue" || s === "pending";
  }).slice(0, 4);
  const paidRows = pendingRows.length < 4
    ? sorted.filter((e) => getPayableDisplayStatus(e) === "paid").slice(0, 4 - pendingRows.length)
    : [];
  const rows = [...pendingRows, ...paidRows];
  const badgeMap: Record<
    string,
    "warning" | "success" | "destructive" | "default"
  > = {
    paid: "success",
    overdue: "destructive",
    cancelled: "default",
    pending: "warning",
    reversed: "default",
  };
  const labelMap: Record<string, string> = {
    paid: "Pago",
    overdue: "Vencido",
    cancelled: "Cancelado",
    pending: "Pendente",
    reversed: "Estornado",
  };
  return (
    <section className="table-card">
      <div className="table-card-header">
        <h2>Contas a pagar</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary font-bold"
          onClick={onViewAll}
        >
          Ver todas
        </Button>
      </div>
      {rows.length ? (
        <>
          <div className="dashboard-table-desktop">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((entry, idx) => {
                  const isPaidStart = idx === pendingRows.length && paidRows.length > 0;
                  return (
                    <React.Fragment key={entry.id}>
                      {isPaidStart && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-1 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Recém pagas
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className={paidRows.length > 0 && idx >= pendingRows.length ? "opacity-60" : ""}>
                        <TableCell
                          className="max-w-[320px] truncate font-medium"
                          title={entry.description}
                        >
                          {entry.description}
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {formatDate(entry.dueDate)}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatMoney(entry.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badgeMap[getPayableDisplayStatus(entry)] ?? "default"}>
                            {labelMap[getPayableDisplayStatus(entry)] ?? getPayableDisplayStatus(entry)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="dashboard-mobile-list">
            {rows.map((entry, idx) => {
              const isPaidStart = idx === pendingRows.length && paidRows.length > 0;
              return (
                <React.Fragment key={entry.id}>
                  {isPaidStart && (
                    <p className="px-1 pt-2 pb-0.5 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Recém pagas
                    </p>
                  )}
                  <article className={cn("dashboard-mobile-record", paidRows.length > 0 && idx >= pendingRows.length ? "opacity-60" : "")}>
                    <div className="dashboard-mobile-record-top">
                      <div className="min-w-0">
                        <h3 className="truncate" title={entry.description}>{entry.description}</h3>
                        <p>Vence em {formatDate(entry.dueDate)}</p>
                      </div>
                      <strong>{formatMoney(entry.amount)}</strong>
                    </div>
                    <div className="dashboard-mobile-record-bottom">
                      <span>Status</span>
                      <Badge variant={badgeMap[getPayableDisplayStatus(entry)] ?? "default"}>
                        {labelMap[getPayableDisplayStatus(entry)] ?? getPayableDisplayStatus(entry)}
                      </Badge>
                    </div>
                  </article>
                </React.Fragment>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState
          title="Nenhuma conta a pagar encontrada."
          description="As próximas obrigações aparecem aqui para acompanhamento rápido."
        />
      )}
    </section>
  );
}
export function Component() {
  const navigate = useNavigate();
  const { data: kpis, isLoading, isError, refetch } = useDashboardKpis();
  const { data: entries = [] } = useFinancialEntries();
  const { data: payables = [] } = useAccountsPayable();
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>("6m");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const cashFlowMonths = getDashboardPeriodMonths(dashboardPeriod);
  const cashFlowRange = useMemo(
    () => getDashboardCashFlowRange(new Date(), cashFlowMonths),
    [cashFlowMonths]
  );
  const { data: cashFlowRows } = useCashFlow(
    "month",
    cashFlowRange.start,
    cashFlowRange.end
  );
  const timedOut = useDataTimeout(isLoading);
  const [hiddenSeries, setHiddenSeries] = useState<
    Record<ChartSeries, boolean>
  >({ receitas: false, despesas: false, saldo: false });

  const saldo = kpis?.saldo ?? 0;
  const totalReceitas = kpis?.totalReceitas ?? 0;
  const totalDespesas = kpis?.totalDespesas ?? 0;
  const contasPagas = kpis
    ? (kpis.contasPagasMes ?? 0) + (kpis.contasRecebidasMes ?? 0)
    : null;
  const pendenciaData = useMemo(
    () => ({
      total:
        (kpis?.contasAVencer ?? 0) +
        (kpis?.contasVencidas ?? 0) +
        (kpis?.contasAReceber ?? 0) +
        (kpis?.contasReceberVencidas ?? 0),
      overdue: (kpis?.contasVencidas ?? 0) + (kpis?.contasReceberVencidas ?? 0),
    }),
    [kpis]
  );

  const chartData = useMemo(
    () =>
      buildFinancialChartData(
        cashFlowRows as CashFlowApiRow[] | undefined,
        cashFlowRange.start,
        cashFlowMonths
      ),
    [cashFlowMonths, cashFlowRange.start, cashFlowRows]
  );
  const hasChartData = chartData.some(
    (item) => item.receitas !== 0 || item.despesas !== 0 || item.saldo !== null
  );
  const kpiSeries = useMemo(
    () => ({
      faturamento: chartData.map((item) => item.receitas),
      lucro: chartData.map((item) => item.saldo).filter((value): value is number => value !== null),
      contasPagas: chartData.map((_item, index) =>
        index === chartData.length - 1 ? (contasPagas ?? 0) : 0
      ),
    }),
    [chartData, contasPagas]
  );

  function toggleSeries(series: ChartSeries) {
    setHiddenSeries((current) => ({ ...current, [series]: !current[series] }));
  }

  function setFocusedSeries(series: ChartSeries | "all") {
    setHiddenSeries({
      receitas: series !== "all" && series !== "receitas",
      despesas: series !== "all" && series !== "despesas",
      saldo: series !== "all" && series !== "saldo",
    });
  }

  const focusedSeries = ((): ChartSeries | "all" => {
    const visible = (Object.entries(hiddenSeries) as Array<[ChartSeries, boolean]>)
      .filter(([, hidden]) => !hidden)
      .map(([series]) => series);
    return visible.length === 1 ? (visible[0] ?? "all") : "all";
  })();

  return (
    <>
      <style>{pageHeaderStyles}</style>
      <style>{dashboardStyles}</style>
      <div className="dashboard-page">
        <header className="page-header">
          <div>
            <h1 className="page-header-title">Dashboard</h1>
            <p className="page-header-desc">
              Visão executiva para acompanhar caixa, lucro, despesas e
              pendências.
            </p>
          </div>
          <div className="page-header-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((current) => !current)}
              aria-expanded={filtersOpen}
              aria-controls="dashboard-filters"
            >
              {getDashboardPeriodLabel(dashboardPeriod)}
              <CalendarDays className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((current) => !current)}
              aria-expanded={filtersOpen}
              aria-controls="dashboard-filters"
            >
              <Filter className="size-4" />
              Filtros
            </Button>
          </div>
        </header>

        {filtersOpen ? (
          <section id="dashboard-filters" className="dashboard-filter-panel">
            <label>
              <span>Período do gráfico</span>
              <Select
                value={dashboardPeriod}
                onChange={(event) =>
                  setDashboardPeriod(event.target.value as DashboardPeriod)
                }
                options={dashboardPeriodOptions}
                aria-label="Selecionar periodo do dashboard"
              />
            </label>
            <label>
              <span>Série em destaque</span>
              <Select
                value={focusedSeries}
                onChange={(event) =>
                  setFocusedSeries(event.target.value as ChartSeries | "all")
                }
                options={dashboardSeriesOptions}
                aria-label="Selecionar série do gráfico"
              />
            </label>
          </section>
        ) : null}

        {isLoading && !timedOut ? (
          <div className="dashboard-top-grid">
            <Card>
              <CardContent className="bg-surface-muted h-[330px] animate-pulse rounded-[20px]" />
            </Card>
            <div className="dashboard-metrics-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="bg-surface-muted h-[292px] animate-pulse rounded-[20px]" />
                </Card>
              ))}
            </div>
          </div>
        ) : isError ? (
          <Card elevated>
            <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="text-text-primary font-bold">
                Não foi possível carregar os KPIs.
              </p>
              <p className="text-text-secondary text-sm">
                Verifique sua conexão e tente novamente.
              </p>
              <Button onClick={() => void refetch()}>Tentar novamente</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="dashboard-top-grid">
              <FinancialHeroCard
                balance={saldo}
                revenue={totalReceitas}
                expenses={totalDespesas}
              />

              <div className="dashboard-kpi-panel">
                <h2>Resumo financeiro</h2>
                <div className="dashboard-metrics-grid">
                  <KpiCard
                    title="Faturamento"
                    value={formatMoney(totalReceitas)}
                    icon={Banknote}
                    tone="green"
                    sparklineData={kpiSeries.faturamento}
                  />
                  <KpiCard
                    title="Lucro"
                    value={formatMoney(saldo)}
                    icon={TrendingUp}
                    tone="blue"
                    sparklineData={kpiSeries.lucro}
                    valueClassName={getMoneyToneClass(saldo)}
                  />
                  <KpiCard
                    title="Contas pagas"
                    value={timedOut && !kpis ? "—" : String(contasPagas ?? 0)}
                    icon={ReceiptText}
                    tone="orange"
                    sparklineData={kpiSeries.contasPagas}
                  />
                  <PendingKpiCard
                    total={pendenciaData.total}
                    overdue={pendenciaData.overdue}
                  />
                </div>
              </div>
            </div>

            <div className="dashboard-middle-grid">
              <section className="chart-card">
                <div className="chart-card-header">
                  <h2>Resumo financeiro</h2>
                  <ChartLegend
                    hiddenSeries={hiddenSeries}
                    onToggle={toggleSeries}
                  />
                </div>
                {hasChartData ? (
                  <div className="chart-card-body">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartData}
                        margin={{ left: 54, right: 18, top: 18, bottom: 6 }}
                        barGap={8}
                      >
                        <defs>
                          <linearGradient
                            id="saldoAreaGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--chart-balance)"
                              stopOpacity={0.16}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--chart-balance)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="4 6"
                          stroke="color-mix(in srgb, var(--border) 54%, transparent)"
                        />
                        <XAxis
                          dataKey="mes"
                          stroke="var(--color-text-muted)"
                          fontSize={12}
                          tickMargin={10}
                        />
                        <YAxis
                          stroke="var(--color-text-muted)"
                          fontSize={12}
                          tickMargin={8}
                          tickFormatter={(v: number) => formatCompactMoney(v)}
                        />
                        <Tooltip
                          content={(props) => (
                            <FinancialTooltip
                              active={props.active}
                              payload={
                                props.payload as ChartPayload[] | undefined
                              }
                            />
                          )}
                        />
                        {!hiddenSeries.saldo ? (
                          <Area
                            type="monotone"
                            dataKey="saldo"
                            fill="url(#saldoAreaGradient)"
                            stroke="none"
                            connectNulls={false}
                          />
                        ) : null}
                        {!hiddenSeries.receitas ? (
                          <Bar
                            dataKey="receitas"
                            name="Receitas"
                            fill="var(--chart-revenue)"
                            fillOpacity={0.92}
                            radius={[7, 7, 0, 0]}
                            maxBarSize={40}
                          />
                        ) : null}
                        {!hiddenSeries.despesas ? (
                          <Bar
                            dataKey="despesas"
                            name="Despesas"
                            fill="var(--chart-expense)"
                            fillOpacity={0.9}
                            radius={[7, 7, 0, 0]}
                            maxBarSize={40}
                          />
                        ) : null}
                        {!hiddenSeries.saldo ? (
                          <Line
                            type="monotone"
                            dataKey="saldo"
                            name="Saldo"
                            stroke="var(--chart-balance)"
                            strokeWidth={3.2}
                            connectNulls={false}
                            dot={{
                              r: 4,
                              strokeWidth: 2,
                              stroke: "var(--card)",
                              fill: "var(--chart-balance)",
                            }}
                            activeDot={{
                              r: 6,
                              strokeWidth: 2,
                              stroke: "var(--card)",
                            }}
                          />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="chart-empty-state">
                    <FileBarChart className="size-9" />
                    <h3>Sem movimentações no período</h3>
                    <p>
                      Receitas, despesas e saldo serão exibidos aqui assim que
                      houver lançamentos nos últimos meses.
                    </p>
                  </div>
                )}
              </section>
              <QuickActionsCard onNavigate={navigate} />
            </div>

            <div className="dashboard-bottom-grid">
              <RecentMovementsTable
                entries={entries}
                onViewAll={() => navigate("/app/financeiro/lancamentos")}
              />
              <AccountsPayableTable
                entries={payables}
                onViewAll={() => navigate("/app/financeiro/contas-pagar")}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

const dashboardStyles = `
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-width: 0;
}

.dashboard-top-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.58fr);
  gap: 22px;
  align-items: stretch;
  min-width: 0;
}

.dashboard-kpi-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dashboard-kpi-panel > h2 {
  margin: 4px 0 0;
  color: var(--text-strong);
  font-size: 18px;
  font-weight: 750;
  letter-spacing: -0.025em;
}

.dashboard-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  min-width: 0;
}

.dashboard-middle-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 0.95fr);
  gap: 22px;
  min-width: 0;
}

.dashboard-bottom-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
  min-width: 0;
}

.dashboard-filter-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  box-shadow: var(--shadow-xs);
}

.dashboard-filter-panel label {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.dashboard-filter-panel span {
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
}

@media (max-width: 1279px) {
  .dashboard-top-grid { grid-template-columns: 1fr; }
  .dashboard-metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dashboard-middle-grid,
  .dashboard-bottom-grid { grid-template-columns: 1fr; }
}

@media (max-width: 639px) {
  .dashboard-metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .dashboard-filter-panel { grid-template-columns: 1fr; }

  .metric-card {
    min-height: 124px;
    padding: 14px;
    gap: 10px;
  }

  .metric-icon { width: 36px; height: 36px; border-radius: 12px; }
  .metric-value { font-size: 1rem; white-space: normal; overflow-wrap: anywhere; }
  .metric-sparkline { display: none; }
}

@media (max-width: 480px) {
  .dashboard-page { gap: 16px; }
}

/* Financial Hero Card */
.financial-hero-card {
  padding: 26px 28px;
  border-radius: 24px;
  color: var(--primary-foreground);
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 85% 10%, rgba(96, 165, 250, 0.38), transparent 170px),
    linear-gradient(135deg, var(--sidebar) 0%, var(--sidebar-2) 48%, var(--sidebar-3) 100%);
  box-shadow: 0 24px 58px rgba(6, 26, 56, 0.28);
  height: fit-content;
}

.financial-hero-glow {
  position: absolute;
  width: 230px;
  height: 230px;
  right: -70px;
  top: -70px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.financial-hero-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.financial-hero-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.financial-hero-header p {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
}

.financial-hero-status {
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.9);
  color: var(--primary-foreground);
  font-size: 12px;
  font-weight: 700;
}

.financial-hero-body {
  position: relative;
  z-index: 1;
  margin-top: 32px;
}

.financial-company {
  margin: 0;
  font-size: 20px;
  font-weight: 750;
}

.financial-label {
  margin: 4px 0 28px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.78);
}

.financial-balance-label {
  margin: 0 0 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.82);
}

.financial-balance {
  display: block;
  font-size: clamp(1.7rem, 4vw, 2.5rem);
  line-height: 1.1;
  font-weight: 750;
  letter-spacing: -0.04em;
}

.financial-hero-footer {
  position: relative;
  z-index: 1;
  margin-top: 26px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.11);
  border: 1px solid rgba(255, 255, 255, 0.14);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.financial-hero-footer > div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.financial-hero-footer > div + div {
  padding-left: 18px;
  border-left: 1px solid rgba(255, 255, 255, 0.16);
}

.financial-mini-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.financial-income {
  color: var(--success-foreground);
}

.financial-expense {
  color: var(--warning-foreground);
}

.financial-hero-footer strong {
  font-size: 16px;
  font-weight: 750;
}

@media (max-width: 768px) {
  .financial-hero-card {
    border-radius: 24px;
    padding: 22px;
  }

  .financial-balance {
    font-size: clamp(1.7rem, 8vw, 2.3rem);
  }

  .financial-hero-footer {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .financial-hero-footer > div + div {
    padding-left: 0;
    border-left: none;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.16);
  }
}

/* Dashboard Metric Cards (replace old .metric-card) */
.metric-card {
  padding: 20px;
  border-radius: 18px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-hover {
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-border-strong);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
}

.metric-icon svg {
  width: 20px;
  height: 20px;
}

.metric-title {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.metric-value {
  display: block;
  margin-top: 6px;
  color: var(--text-strong);
  font-size: clamp(1.1rem, 1.5vw, 1.5rem);
  line-height: 1.1;
  font-weight: 750;
  letter-spacing: -0.03em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-trend {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.metric-trend small {
  color: var(--text-muted);
}

/* Chart card */
.chart-card {
  min-width: 0;
  overflow: hidden;
  padding: 24px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(14px);
}

.chart-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.chart-card-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
}

.chart-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.legend-line {
  width: 18px;
  height: 2px;
  border-radius: 999px;
}

.chart-card-body {
  height: 300px;
  min-height: 262px;
  min-width: 0;
}

.chart-empty-state {
  min-height: 220px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-surface-muted) 58%, transparent);
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
}

.chart-empty-state svg {
  color: var(--primary);
}

.chart-empty-state h3 {
  margin: 0;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 750;
}

.chart-empty-state p {
  margin: 0;
  max-width: 440px;
  font-size: 13px;
  line-height: 1.5;
}

/* Quick actions */
.quick-actions-card {
  min-width: 0;
  padding: 24px;
  border-radius: 22px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(14px);
}

.quick-actions-card h2 {
  margin: 0 0 18px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
}

.quick-actions-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.quick-action-card {
  width: 100%;
  min-height: 76px;
  padding: 14px 16px;
  border-radius: 15px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 84%, transparent);
  color: inherit;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  line-height: 1;
  transition: background-color 180ms ease, border-color 180ms ease, transform 180ms ease;
  cursor: pointer;
}

.quick-action-card:hover {
  background: var(--color-surface-muted);
  border-color: var(--color-border-strong);
  transform: translateX(2px);
}

.quick-action-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.quick-action-icon {
  width: 48px;
  height: 48px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.quick-action-icon svg {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.quick-action-icon-purple {
  background: var(--color-purple-soft);
  color: var(--color-purple);
}

.quick-action-icon-blue {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.quick-action-icon-green {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.quick-action-left strong {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.quick-action-left p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.quick-action-chevron {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  flex-shrink: 0;
}

/* Table cards */
.table-card {
  min-width: 0;
  overflow: hidden;
  padding: 20px;
  border-radius: 22px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(14px);
}

.table-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.table-card-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
}

.dashboard-table-desktop {
  min-width: 0;
  overflow: hidden;
}

.dashboard-mobile-list {
  display: none;
}

.dashboard-mobile-record {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  padding: 14px;
  box-shadow: var(--shadow-xs);
}

.dashboard-mobile-record-top,
.dashboard-mobile-record-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.dashboard-mobile-record-top {
  align-items: flex-start;
}

.dashboard-mobile-record-top h3 {
  margin: 0;
  color: var(--text-strong);
  font-size: 14px;
  font-weight: 750;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.dashboard-mobile-record-top p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.35;
}

.dashboard-mobile-record-top strong {
  flex: 0 0 auto;
  max-width: 44%;
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
  text-align: right;
  overflow-wrap: anywhere;
}

.dashboard-mobile-record-bottom {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-soft);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .chart-card,
  .quick-actions-card,
  .table-card {
    padding: 16px;
    border-radius: 18px;
  }

  .chart-card-header,
  .table-card-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .chart-legend {
    width: 100%;
    gap: 8px;
  }

  .chart-legend button {
    flex: 1 1 auto;
    min-width: max-content;
  }

  .chart-card-body {
    height: 260px;
  }

  .dashboard-table-desktop {
    display: none;
  }

  .dashboard-mobile-list {
    display: grid;
    gap: 10px;
  }
}

`;
