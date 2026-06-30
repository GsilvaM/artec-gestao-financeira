import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Clock3,
  ClipboardList,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Plus,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/layout/page-shell";
import { MetricCard as DashboardMetricCard } from "@/components/dashboard/MetricCard";
import { StatusBanner } from "@/components/dashboard/StatusBanner";
import { useDashboardKpis } from "@/domain/financeiro/hooks/use-dashboard-kpis";
import { useCashFlow } from "@/domain/financeiro/hooks/use-cash-flow";
import { formatMoney, toFiniteNumber } from "@/lib/utils";
import { calculateFinancialPercentages, formatCompactMoney, getActivityStatusMeta, type ActivityStatus } from "./dashboard-utils";

type ChartSeries = "receitas" | "despesas" | "saldo";

type FinancialChartPoint = {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
};

type CashFlowApiRow = {
  period?: unknown;
  receitas?: unknown;
  despesas?: unknown;
  saldo?: unknown;
};

const PENDING_TONE_STYLES = {
  warning: { bg: "bg-warning-light dark:bg-[#3a2908]", icon: "text-warning", ring: "ring-warning/20", accent: "from-[var(--color-pending)]/45" },
  danger: { bg: "bg-destructive-light dark:bg-[#4a1010]", icon: "text-destructive", ring: "ring-destructive/20", accent: "from-[var(--color-expense)]/45" },
  success: { bg: "bg-success-light dark:bg-[#073a1c]", icon: "text-success", ring: "ring-success/20", accent: "from-[var(--color-revenue)]/45" },
} as const;

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

function DashboardKpiSkeleton() {
  return (
    <Card>
      <CardContent className="min-h-[12.5rem] space-y-4 p-5">
        <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-36 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
        <div className="h-12 animate-pulse rounded-lg bg-muted" />
      </CardContent>
    </Card>
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
    <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onToggle(item.id)}
          className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35", hiddenSeries[item.id] && "opacity-45")}
          aria-pressed={!hiddenSeries[item.id]}
        >
          <span className={cn(item.id === "saldo" ? "h-0.5 w-4 rounded-full" : "size-2.5 rounded-full", item.className)} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

type ChartPayload = {
  payload?: { receitas: number; despesas: number; saldo: number; mes: string };
};

function FinancialTooltip({ active, payload }: { active?: boolean; payload?: ChartPayload[] }) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-3 text-xs text-card-foreground shadow-[var(--shadow-soft)]">
      <p className="mb-2 font-semibold text-foreground">{item.mes}</p>
      <div className="space-y-1.5">
        <p className="flex items-center justify-between gap-8"><span className="text-muted-foreground">Receita</span><strong className="text-[var(--color-revenue)]">{formatMoney(item.receitas)}</strong></p>
        <p className="flex items-center justify-between gap-8"><span className="text-muted-foreground">Despesa</span><strong className="text-[var(--color-expense)]">{formatMoney(item.despesas)}</strong></p>
        <p className="flex items-center justify-between gap-8"><span className="text-muted-foreground">Saldo</span><strong className="text-[var(--color-balance)]">{formatMoney(item.saldo)}</strong></p>
      </div>
    </div>
  );
}

function getDashboardCashFlowRange(referenceDate = new Date()) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 5, 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  const label = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildFinancialChartData(rows: CashFlowApiRow[] | undefined, start: Date, months = 6): FinancialChartPoint[] {
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

  return Array.from({ length: months }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    const current = totalsByMonth.get(monthKey(date)) ?? { receitas: 0, despesas: 0, saldo: 0 };
    return { mes: monthLabel(date), ...current };
  });
}

function getSeriesDelta(values: number[]) {
  const current = values.at(-1);
  const previous = values.at(-2);
  if (typeof current !== "number" || typeof previous !== "number" || previous === 0) return undefined;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

function getActivityItems(pendenciaData: {
  contasAVencer: number;
  contasVencidas: number;
  contasAReceber: number;
  contasReceberVencidas: number;
}): { id: string; label: string; status: ActivityStatus }[] {
  const items: { id: string; label: string; status: ActivityStatus }[] = [];
  if (pendenciaData.contasVencidas > 0) items.push({ id: "contas-pagar-vencidas", label: `${pendenciaData.contasVencidas} contas a pagar vencidas`, status: "overdue" });
  if (pendenciaData.contasReceberVencidas > 0) items.push({ id: "contas-receber-vencidas", label: `${pendenciaData.contasReceberVencidas} contas a receber vencidas`, status: "overdue" });
  if (pendenciaData.contasAVencer > 0) items.push({ id: "contas-pagar-pendentes", label: `${pendenciaData.contasAVencer} contas a pagar pendentes`, status: "pending" });
  if (pendenciaData.contasAReceber > 0) items.push({ id: "contas-receber-pendentes", label: `${pendenciaData.contasAReceber} contas a receber pendentes`, status: "pending" });
  return items;
}

function PendingCard({
  title,
  value,
  icon: Icon,
  tone,
  details,
}: {
  title: string;
  value: number;
  icon: typeof Clock3;
  tone: "warning" | "danger" | "success";
  details?: { label: string; highlight?: boolean }[];
}) {
  const styles = PENDING_TONE_STYLES[tone];
  return (
    <Card className="relative overflow-hidden transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-[linear-gradient(180deg,#292925_0%,#22221f_100%)]">
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent", styles.accent)} />
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1", styles.bg, styles.icon, styles.ring)}>
            <Icon className="size-5" />
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">{value}</p>
        {details?.length ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {details.map((d) => (
              <span
                key={d.label}
                className={cn(
                  "text-xs",
                  d.highlight ? "font-semibold text-destructive" : "text-muted-foreground",
                )}
              >
                {d.label}
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatisticBar({ icon: Icon, label, value, amount, tone, delay = 0 }: { icon: LucideIcon; label: string; value: number; amount: number; tone: "green" | "red" | "blue"; delay?: number }) {
  const colors = {
    green: { icon: "bg-success-light text-success", bar: "bg-[var(--color-revenue)]" },
    red: { icon: "bg-destructive-light text-destructive", bar: "bg-[var(--color-expense)]" },
    blue: { icon: "bg-primary-light text-primary", bar: "bg-[var(--color-balance)]" },
  };

  return (
    <div className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-4">
      <div className={cn("flex size-11 items-center justify-center rounded-md", colors[tone].icon)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#E2E8F0] dark:bg-[#2D3748]" title={`${label}: ${formatMoney(amount)}`}>
          <div className={cn("h-full rounded-[3px] transition-[width] duration-[600ms] ease-out", colors[tone].bar, percentWidthClass(value))} style={{ transitionDelay: `${delay}ms` }} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      </div>
      <div className="whitespace-nowrap text-right text-xl font-bold tabular-nums text-foreground">{value.toFixed(1)}%</div>
    </div>
  );
}

function percentWidthClass(value: number) {
  if (value >= 96) return "w-full";
  if (value >= 88) return "w-11/12";
  if (value >= 80) return "w-5/6";
  if (value >= 70) return "w-3/4";
  if (value >= 62) return "w-2/3";
  if (value >= 54) return "w-7/12";
  if (value >= 46) return "w-1/2";
  if (value >= 38) return "w-5/12";
  if (value >= 30) return "w-1/3";
  if (value >= 22) return "w-1/4";
  if (value >= 14) return "w-1/6";
  if (value > 0) return "w-1/12";
  return "w-0";
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="space-y-4 p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export function Component() {
  const navigate = useNavigate();
  const { data: kpis, isLoading, isError, refetch } = useDashboardKpis();
  const cashFlowRange = useMemo(() => getDashboardCashFlowRange(), []);
  const { data: cashFlowRows } = useCashFlow("month", cashFlowRange.start, cashFlowRange.end);
  const timedOut = useDataTimeout(isLoading);
  const [hiddenSeries, setHiddenSeries] = useState<Record<ChartSeries, boolean>>({ receitas: false, despesas: false, saldo: false });
  const saldo = kpis?.saldo ?? 0;
  const totalReceitas = kpis?.totalReceitas ?? 0;
  const totalDespesas = kpis?.totalDespesas ?? 0;
  const { receitaPercent, despesaPercent, saldoPercent } = calculateFinancialPercentages(totalReceitas, totalDespesas, saldo);
  const contasPagas = kpis ? (kpis.contasPagasMes ?? 0) + (kpis.contasRecebidasMes ?? 0) : null;
  const chartData = useMemo(
    () => buildFinancialChartData(cashFlowRows as CashFlowApiRow[] | undefined, cashFlowRange.start),
    [cashFlowRange.start, cashFlowRows],
  );
  const dashboardKpiSeries = useMemo(() => ({
    faturamento: chartData.map((item) => item.receitas),
    lucro: chartData.map((item) => item.saldo),
  }), [chartData]);
  const faturamentoDelta = getSeriesDelta(dashboardKpiSeries.faturamento);
  const lucroDelta = getSeriesDelta(dashboardKpiSeries.lucro);

  const pendenciaData = useMemo(() => {
    const contasAVencer = kpis?.contasAVencer ?? 0;
    const contasVencidas = kpis?.contasVencidas ?? 0;
    const contasAReceber = kpis?.contasAReceber ?? 0;
    const contasReceberVencidas = kpis?.contasReceberVencidas ?? 0;
    return {
      totalPagar: contasAVencer + contasVencidas,
      totalReceber: contasAReceber + contasReceberVencidas,
      totalVencidas: contasVencidas + contasReceberVencidas,
      contasAVencer,
      contasVencidas,
      contasAReceber,
      contasReceberVencidas,
    };
  }, [kpis]);
  const activityItems = useMemo(() => getActivityItems(pendenciaData), [pendenciaData]);

  const shortcuts = [
    { label: "Novo lançamento", to: "/app/financeiro/lancamentos", hint: "⌘ N", tone: "primary" },
    { label: "Nova conta a pagar", to: "/app/financeiro/contas-pagar", hint: "⌘ P", tone: "expense" },
    { label: "Emitir relatório", to: "/app/relatorios", hint: "⌘ R", tone: "balance" },
  ];

  function toggleSeries(series: ChartSeries) {
    setHiddenSeries((current) => ({ ...current, [series]: !current[series] }));
  }

  return (
    <PageShell
      icon={LayoutDashboard}
      title="Dashboard"
      subtitle="Visão executiva para acompanhar caixa, lucro, despesas e pendências."
    >
      {isLoading ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
          <Card className="overflow-hidden dark:border-white/10">
            <CardContent className="space-y-6 p-5 sm:p-6">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-64 animate-pulse rounded-lg bg-muted" />
              <div className="h-2 animate-pulse rounded-full bg-muted" />
            </CardContent>
          </Card>
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <Card className="overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground">Cartão financeiro</p>
                  <p className="text-sm text-muted-foreground">Resumo do caixa financeiro</p>
                </div>
                <CreditCard className="size-5 shrink-0 text-primary" />
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_18px_18px,rgba(255,255,255,0.05)_2px,transparent_2px),linear-gradient(135deg,var(--color-card-bg),#174a78)] bg-[length:34px_34px,auto] p-6 text-white shadow-[0_28px_60px_-34px_rgba(30,96,145,0.9)] ring-1 ring-white/10 dark:bg-[radial-gradient(circle_at_18px_18px,rgba(255,255,255,0.035)_2px,transparent_2px),linear-gradient(135deg,#141b22,#0d2a45_58%,#111111)] dark:shadow-[0_28px_70px_-38px_rgba(0,0,0,0.95)] sm:p-7">
                <div className="absolute -right-16 -top-14 size-44 rounded-full bg-white/[0.06]" />
                <div className="absolute -bottom-24 right-8 size-52 rounded-full bg-[var(--color-balance)]/10" />
                <div className="relative flex min-h-[21rem] flex-col gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xl font-bold">Artec Gestão</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/[0.65]">Conta financeira</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[rgba(29,158,117,0.25)] px-3 py-1 text-[11px] font-medium text-[#9FE1CB] ring-1 ring-white/15">Ativo</span>
                  </div>
                  <div className="mt-auto">
                    <p className="text-xs font-medium text-white/70">Saldo atual</p>
                    <p className="mt-1.5 text-3xl font-bold tabular-nums sm:text-4xl">{formatMoney(saldo)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/10 p-4 text-sm ring-1 ring-white/10 backdrop-blur dark:bg-black/18">
                    <div>
                      <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/60"><ArrowUpCircle className="size-3 text-[var(--color-revenue)]" />Receitas</p>
                      <p className="mt-1 font-semibold tabular-nums">{formatMoney(totalReceitas)}</p>
                    </div>
                    <div>
                      <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/60"><ArrowDownCircle className="size-3 text-[var(--color-expense)]" />Despesas</p>
                      <p className="mt-1 font-semibold tabular-nums">{formatMoney(totalDespesas)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Participação das receitas</span>
                  <span className="whitespace-nowrap font-semibold tabular-nums text-foreground">{receitaPercent}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full bg-primary transition-[width] duration-[800ms] ease-in-out", percentWidthClass(receitaPercent))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Pendências</h2>
                {pendenciaData.totalVencidas > 0 ? (
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-destructive/15 text-xs font-bold text-destructive">
                    {pendenciaData.totalVencidas}
                  </span>
                ) : null}
              </div>

              {pendenciaData.totalPagar === 0 && pendenciaData.totalReceber === 0 ? (
                <StatusBanner />
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <PendingCard
                    title="A Pagar"
                    value={pendenciaData.totalPagar}
                    icon={Clock3}
                    tone="warning"
                    details={[
                      { label: `${pendenciaData.contasVencidas} vencidas`, highlight: pendenciaData.contasVencidas > 0 },
                      { label: `${pendenciaData.contasAVencer} a vencer` },
                    ]}
                  />
                  <PendingCard
                    title="A Receber"
                    value={pendenciaData.totalReceber}
                    icon={DollarSign}
                    tone="success"
                    details={[
                      { label: `${pendenciaData.contasReceberVencidas} vencidas`, highlight: pendenciaData.contasReceberVencidas > 0 },
                      { label: `${pendenciaData.contasAReceber} a vencer` },
                    ]}
                  />
                  <PendingCard
                    title="Vencidas"
                    value={pendenciaData.totalVencidas}
                    icon={AlertTriangle}
                    tone="danger"
                    details={[
                      { label: `${pendenciaData.contasVencidas} contas a pagar`, highlight: pendenciaData.contasVencidas > 0 },
                      { label: `${pendenciaData.contasReceberVencidas} contas a receber`, highlight: pendenciaData.contasReceberVencidas > 0 },
                    ]}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {isLoading && !timedOut ? (
                <>
                  <DashboardKpiSkeleton />
                  <DashboardKpiSkeleton />
                  <DashboardKpiSkeleton />
                </>
              ) : isError ? (
                <Card className="sm:col-span-2 2xl:col-span-3">
                  <CardContent className="flex min-h-[12.5rem] flex-col items-center justify-center gap-3 p-5 text-center">
                    <p className="text-sm font-semibold text-foreground">Não foi possível carregar os KPIs.</p>
                    <p className="text-[13px] text-muted-foreground">Verifique sua conexão e tente novamente.</p>
                    <Button type="button" variant="outline" onClick={() => void refetch()}>Tentar novamente</Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <DashboardMetricCard
                    label="Faturamento"
                    value={formatMoney(totalReceitas)}
                    title={formatMoney(totalReceitas)}
                    icon={ArrowUpCircle}
                    iconColor="green"
                    footer="Receitas registradas"
                    delta={faturamentoDelta}
                    deltaUnavailableLabel="Sem dados no mês anterior"
                    sparklineData={dashboardKpiSeries.faturamento}
                  />
                  <DashboardMetricCard
                    label="Lucro"
                    value={formatMoney(saldo)}
                    title={formatMoney(saldo)}
                    icon={Banknote}
                    iconColor="blue"
                    footer="Receitas menos despesas"
                    delta={lucroDelta}
                    deltaUnavailableLabel="Sem dados no mês anterior"
                    sparklineData={dashboardKpiSeries.lucro}
                  />
                  <DashboardMetricCard
                    label="Contas pagas"
                    value={timedOut && !kpis ? "—" : String(contasPagas ?? 0)}
                    title={timedOut && !kpis ? "Aguardando dados" : String(contasPagas ?? 0)}
                    icon={ArrowDownCircle}
                    iconColor="red"
                    footer={timedOut && !kpis ? "Aguardando dados" : "Pagas e recebidas no mês"}
                  />
                  {timedOut && !kpis ? <span className="sr-only" aria-live="polite">Dados de contas pagas indisponíveis após 5 segundos. Valor exibido como traço.</span> : null}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid items-stretch gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-5 text-primary" />
              Resumo financeiro
            </CardTitle>
            <ChartLegend hiddenSeries={hiddenSeries} onToggle={toggleSeries} />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-5 pt-6 sm:p-6 sm:pt-6">
            <div className="h-[200px] sm:h-80" role="img" aria-label={`Resumo financeiro: receitas ${formatMoney(totalReceitas)}, despesas ${formatMoney(totalDespesas)} e saldo ${formatMoney(saldo)}.`}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ left: 64, right: 18, top: 18, bottom: 4 }} barGap={8}>
                  <defs>
                    <linearGradient id="saldoAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-balance)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="var(--chart-balance)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="color-mix(in srgb, var(--border) 62%, transparent)" />
                  <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickMargin={8} />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickMargin={8}
                    tickFormatter={(v: number) => formatCompactMoney(v)}
                  />
                  <Tooltip
                    content={(props) => <FinancialTooltip active={props.active} payload={props.payload as ChartPayload[] | undefined} />}
                  />
                  {!hiddenSeries.saldo ? <Area type="monotone" dataKey="saldo" fill="url(#saldoAreaGradient)" stroke="none" /> : null}
                  {!hiddenSeries.receitas ? <Bar dataKey="receitas" name="Receitas" fill="var(--chart-revenue)" fillOpacity={0.9} radius={[4, 4, 0, 0]} maxBarSize={38} /> : null}
                  {!hiddenSeries.despesas ? <Bar dataKey="despesas" name="Despesas" fill="var(--chart-expense)" fillOpacity={0.82} radius={[4, 4, 0, 0]} maxBarSize={38} /> : null}
                  {!hiddenSeries.saldo ? (
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      name="Saldo"
                      stroke="var(--chart-balance)"
                      strokeWidth={3}
                      dot={{ r: 5, strokeWidth: 2, stroke: "var(--card)", fill: "var(--chart-balance)" }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--card)" }}
                    />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="size-5 text-primary" />
              Atalhos rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-3 pt-5">
            {shortcuts.map((item) => (
              <Button
                key={item.label}
                variant="outline"
                className={cn(
                  "group min-h-11 w-full justify-start gap-3 rounded-[10px] px-4 transition duration-150",
                  item.tone === "primary"
                    ? "border-transparent bg-[var(--color-card-bg)] text-white hover:bg-[#24476f] hover:text-white"
                    : "border-border bg-card text-foreground hover:bg-secondary",
                )}
                onClick={() => navigate(item.to)}
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", item.tone === "primary" ? "bg-white/15" : "bg-primary/10 text-primary")}>
                  <Plus className="size-4" />
                </span>
                <span className="truncate">{item.label}</span>
                <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">{item.hint}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="size-5 text-primary" />
              Atividades recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {activityItems.length ? (
              <div className="space-y-1">
                {activityItems.map((item) => {
                  const status = getActivityStatusMeta(item.status);
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-0">
                      <span className="min-w-0 text-[13px] leading-6 text-foreground">{item.label}</span>
                      <Badge variant="secondary" className={cn("shrink-0 whitespace-nowrap text-[11px] font-medium ring-1", status.className)}>{status.label}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <ClipboardList className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhuma atividade pendente.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="size-5 text-primary" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-5">
              <StatisticBar icon={ArrowUpCircle} label="Receitas" value={receitaPercent} amount={totalReceitas} tone="green" />
              <StatisticBar icon={ArrowDownCircle} label="Despesas" value={despesaPercent} amount={totalDespesas} tone="red" delay={100} />
              <StatisticBar icon={TrendingUp} label="Saldo" value={saldoPercent} amount={saldo} tone="blue" delay={200} />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

