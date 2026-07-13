import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileBarChart,
  Filter,
  Plus,
  ReceiptText,
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn, formatMoney, toFiniteNumber } from "@/lib/utils";
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
  onViewCashFlow,
}: {
  balance: number;
  revenue: number;
  expenses: number;
  onViewCashFlow: () => void;
}) {
  return (
    <section className="financial-hero-card">
      <div className="financial-hero-header">
        <div>
          <h2>Saldo disponível</h2>
          <p>Resumo consolidado do caixa.</p>
        </div>
      </div>
      <div className="financial-hero-body">
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
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="financial-hero-action"
        onClick={onViewCashFlow}
      >
        Ver fluxo de caixa
      </Button>
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
            <Card className="dashboard-loading-hero">
              <CardContent>
                <div className="dashboard-loading-line short" />
                <div className="dashboard-loading-line tiny" />
                <div className="dashboard-loading-balance" />
                <div className="dashboard-loading-mini-grid">
                  <Skeleton className="h-12 rounded-2xl" />
                  <Skeleton className="h-12 rounded-2xl" />
                </div>
              </CardContent>
            </Card>
            <div className="dashboard-metrics-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="dashboard-loading-metric">
                  <CardContent>
                    <Skeleton className="size-9 rounded-xl" />
                    <Skeleton className="h-3 w-24 rounded-full" />
                    <Skeleton className="h-6 w-28 rounded-full" />
                    <Skeleton className="h-8 w-full rounded-xl" />
                  </CardContent>
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
                onViewCashFlow={() => navigate("/app/financeiro/fluxo-caixa")}
              />

              <div className="dashboard-kpi-panel">
                <h2>Indicadores complementares</h2>
                <div className="dashboard-metrics-grid">
                  <KpiCard
                    title="Contas pagas"
                    value={timedOut && !kpis ? "—" : String(contasPagas ?? 0)}
                    icon={ReceiptText}
                    tone="orange"
                    sparklineData={kpiSeries.contasPagas}
                  />
                  <KpiCard
                    title="Vencidas"
                    value={String(pendenciaData.overdue)}
                    icon={Bell}
                    tone="orange"
                    sparklineData={kpiSeries.contasPagas}
                    valueClassName={pendenciaData.overdue > 0 ? "text-warning" : "text-success"}
                  />
                  <KpiCard
                    title="Janela do gráfico"
                    value={getDashboardPeriodLabel(dashboardPeriod)}
                    icon={CalendarDays}
                    tone="blue"
                    sparklineData={kpiSeries.lucro}
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
                  <h2>Evolucao financeira</h2>
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

.dashboard-loading-hero,
.dashboard-loading-metric {
  overflow: hidden;
  border-radius: 20px;
  border-color: var(--border-subtle);
  background: color-mix(in srgb, var(--color-surface) 94%, var(--surface-muted));
}

.dashboard-loading-hero > div,
.dashboard-loading-metric > div {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.dashboard-loading-hero > div {
  min-height: 260px;
  align-content: start;
}

.dashboard-loading-metric > div {
  min-height: 142px;
}

.dashboard-loading-line,
.dashboard-loading-balance {
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--surface-muted) 76%, transparent),
    color-mix(in srgb, var(--primary) 12%, var(--surface-muted)),
    color-mix(in srgb, var(--surface-muted) 76%, transparent)
  );
  background-size: 220% 100%;
  animation: skeleton-shimmer 1.35s ease-in-out infinite;
}

.dashboard-loading-line.short {
  width: 46%;
  height: 14px;
}

.dashboard-loading-line.tiny {
  width: 32%;
  height: 10px;
}

.dashboard-loading-balance {
  margin-top: 36px;
  width: 72%;
  height: 34px;
}

.dashboard-loading-mini-grid {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@keyframes skeleton-shimmer {
  from { background-position: 120% 0; }
  to { background-position: -120% 0; }
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

  .dashboard-loading-hero > div {
    min-height: 190px;
  }

  .dashboard-loading-metric > div {
    min-height: 118px;
    padding: 14px;
  }

  .metric-card {
    min-height: 112px;
    padding: 12px;
    gap: 8px;
  }

  .metric-icon { width: 34px; height: 34px; border-radius: 12px; }
  .metric-icon svg { width: 18px; height: 18px; }
  .metric-title { font-size: 0.625rem; }
  .metric-value { font-size: 1rem; white-space: normal; overflow-wrap: anywhere; }
  .metric-trend { font-size: 12px; }
  .metric-sparkline { display: none; }
}

@media (max-width: 480px) {
  .dashboard-page { gap: 16px; }
}

/* Financial Hero Card */
.financial-hero-card {
  padding: 22px;
  border-radius: 18px;
  color: var(--primary-foreground);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--sidebar) 0%, var(--sidebar-2) 62%, var(--sidebar-3) 100%);
  box-shadow: var(--shadow-sm);
  height: fit-content;
}

.financial-hero-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.financial-hero-header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 750;
  letter-spacing: 0;
}

.financial-hero-header p {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.68);
}

.financial-hero-body {
  position: relative;
  z-index: 1;
  margin-top: 26px;
}

.financial-balance {
  display: block;
  font-size: clamp(1.85rem, 4vw, 2.75rem);
  line-height: 1.1;
  font-weight: 750;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.financial-hero-footer {
  position: relative;
  z-index: 1;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.financial-hero-footer > div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.financial-hero-footer > div + div {
  padding-left: 0;
  border-left: none;
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
  color: var(--danger-foreground);
}

.financial-hero-footer strong {
  font-size: 15px;
  font-weight: 750;
  overflow-wrap: anywhere;
}

.financial-hero-action {
  position: relative;
  z-index: 1;
  margin-top: 18px;
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.1);
  color: var(--primary-foreground);
}

.financial-hero-action:hover {
  background: rgba(255, 255, 255, 0.16);
  color: var(--primary-foreground);
}

@media (max-width: 768px) {
  .financial-hero-card {
    border-radius: 16px;
    padding: 18px;
  }

  .financial-balance {
    font-size: clamp(1.7rem, 8vw, 2.3rem);
  }

  .financial-hero-footer { gap: 12px; }
}

@media (max-width: 480px) {
  .financial-hero-header {
    align-items: center;
  }

  .financial-hero-header h2 {
    font-size: 15px;
  }

  .financial-hero-header p {
    display: none;
  }

  .financial-hero-body {
    margin-top: 18px;
  }

  .financial-balance {
    overflow-wrap: anywhere;
  }

  .financial-hero-footer {
    margin-top: 16px;
  }

  .financial-hero-footer strong {
    overflow-wrap: anywhere;
    font-size: 14px;
  }
}

/* Dashboard Metric Cards (replace old .metric-card) */
.metric-card {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-hover {
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.card-hover:hover {
  transform: none;
  box-shadow: var(--shadow-xs);
  border-color: color-mix(in srgb, var(--primary) 14%, var(--color-border));
}

.metric-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
}

.metric-icon svg {
  width: 18px;
  height: 18px;
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
  font-size: clamp(1rem, 1.35vw, 1.32rem);
  line-height: 1.1;
  font-weight: 750;
  letter-spacing: 0;
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
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: none;
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
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: none;
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
  min-height: 68px;
  padding: 12px 14px;
  border-radius: 13px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 96%, var(--surface-2));
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

@media (max-width: 768px) {
  .quick-action-card {
    min-height: 64px;
    padding: 12px;
  }

  .quick-action-icon {
    width: 40px;
    height: 40px;
    border-radius: 13px;
  }

  .quick-action-icon svg {
    width: 18px;
    height: 18px;
  }

  .quick-action-left {
    gap: 10px;
  }

  .quick-action-left strong {
    font-size: 13px;
  }

  .quick-action-left p {
    font-size: 11px;
    line-height: 1.3;
  }
}

.quick-action-card:hover {
  background: var(--color-surface-muted);
  border-color: var(--color-border-strong);
  transform: none;
}

.quick-action-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.quick-action-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.quick-action-icon svg {
  width: 19px;
  height: 19px;
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
  padding: 18px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: none;
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
  border-radius: 14px;
  background: var(--color-surface);
  padding: 12px;
  box-shadow: none;
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
  flex: 1 1 auto;
  max-width: 52%;
  min-width: 0;
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
    padding: 14px;
    border-radius: 14px;
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

  .dashboard-mobile-record-top strong {
    max-width: 58%;
    font-size: 12px;
  }
}

@media (max-width: 380px) {
  .dashboard-metrics-grid {
    grid-template-columns: 1fr;
  }

  .chart-legend button {
    width: 100%;
    min-width: 0;
  }

  .dashboard-mobile-record-top {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .dashboard-mobile-record-top strong {
    max-width: 100%;
    text-align: left;
  }
}

`;
