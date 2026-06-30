import { useEffect, useMemo, useState } from "react";
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
  MoreVertical,
  Plus,
  ReceiptText,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SparklineChart } from "@/components/dashboard/SparklineChart";
import { useAccountsPayable } from "@/domain/financeiro/hooks/use-accounts";
import { useCashFlow } from "@/domain/financeiro/hooks/use-cash-flow";
import { useDashboardKpis } from "@/domain/financeiro/hooks/use-dashboard-kpis";
import { useFinancialEntries } from "@/domain/financeiro/hooks/use-financial-entries";
import type { AccountPayableRow, FinancialEntryRow } from "@/domain/financeiro/types";
import { cn, formatMoney, toFiniteNumber } from "@/lib/utils";
import { formatCompactMoney } from "./dashboard-utils";

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

  const monthlyData = Array.from({ length: months }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    const current = totalsByMonth.get(monthKey(date)) ?? { receitas: 0, despesas: 0, saldo: 0 };
    return { mes: monthLabel(date), ...current };
  });

  let accumulatedBalance = 0;
  return monthlyData.map((item) => {
    accumulatedBalance += item.saldo;
    return { ...item, saldo: accumulatedBalance };
  });
}

function getSeriesDelta(values: number[]) {
  const current = values.at(-1);
  const previous = values.at(-2);
  if (typeof current !== "number" || typeof previous !== "number" || previous === 0) return undefined;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

function formatLongDate(date = new Date()) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function DeltaBadge({ value }: { value?: number }) {
  if (typeof value !== "number") {
    return <span className="text-xs font-medium text-muted-foreground">Sem dados</span>;
  }
  const positive = value >= 0;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-bold", positive ? "text-success" : "text-destructive")}>
      {positive ? <ArrowUpCircle className="size-3.5" /> : <ArrowDownCircle className="size-3.5" />}
      {positive ? "+" : ""}{value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
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
  footer,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone: "green" | "blue" | "orange";
  delta?: number;
  sparklineData: number[];
  footer?: string;
}) {
  const toneStyles = {
    green: "bg-[var(--green-soft)] text-[var(--green-600)]",
    blue: "bg-[var(--blue-soft)] text-[var(--blue-600)]",
    orange: "bg-[var(--orange-soft)] text-[var(--orange-600)]",
  };
  const sparklineColor = tone === "orange" ? "red" : tone;

  return (
    <Card className="min-h-[248px] overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <CardContent className="flex h-full min-h-[248px] flex-col justify-between p-5">
        <div className="space-y-4">
          <div className={cn("flex size-11 items-center justify-center rounded-2xl", toneStyles[tone])}>
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 truncate text-2xl font-extrabold tracking-tight text-foreground tabular-nums" title={String(value)}>{value}</p>
          </div>
          <div className="space-y-1">
            <DeltaBadge value={delta} />
            <p className="text-xs text-muted-foreground">{footer ?? "vs. mês anterior"}</p>
          </div>
        </div>
        <div className="h-12">
          <SparklineChart data={sparklineData.length ? sparklineData : [0, 0, 0, 0, 0, 0]} color={sparklineColor} />
        </div>
      </CardContent>
    </Card>
  );
}

function PendingKpiCard({ total, overdue }: { total: number; overdue: number }) {
  const hasPending = total > 0;
  return (
    <Card className="relative min-h-[248px] overflow-hidden border-purple-200/70 bg-[linear-gradient(180deg,var(--surface)_0%,var(--purple-soft)_160%)]">
      <CardContent className="relative z-10 flex h-full min-h-[248px] flex-col justify-between p-5">
        <div className="space-y-4">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--purple-soft)] text-[var(--purple-600)]">
            <Bell className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pendências</p>
            <p className="mt-2 text-2xl font-extrabold text-foreground">{hasPending ? total : "0"}</p>
          </div>
          <div className="space-y-2">
            <p className={cn("inline-flex items-center gap-1.5 text-sm font-bold", hasPending ? "text-warning" : "text-success")}>
              <CheckCircle2 className="size-4" />
              {hasPending ? `${overdue} vencidas` : "Tudo em dia"}
            </p>
            <p className="max-w-40 text-xs leading-5 text-muted-foreground">
              {hasPending ? "Revise as contas pendentes no financeiro." : "Todas as contas estão dentro do prazo."}
            </p>
          </div>
        </div>
      </CardContent>
      <CheckCircle2 className="absolute -bottom-4 -right-4 size-24 text-[var(--purple-600)]/18" />
    </Card>
  );
}

type ChartPayload = {
  payload?: { receitas: number; despesas: number; saldo: number; mes: string };
};

function FinancialTooltip({ active, payload }: { active?: boolean; payload?: ChartPayload[] }) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-xs text-card-foreground shadow-[var(--shadow-card)]">
      <p className="mb-2 font-semibold text-foreground">{item.mes}</p>
      <div className="space-y-1.5">
        <p className="flex items-center justify-between gap-8"><span className="text-muted-foreground">Receitas</span><strong className="text-[var(--color-revenue)]">{formatMoney(item.receitas)}</strong></p>
        <p className="flex items-center justify-between gap-8"><span className="text-muted-foreground">Despesas</span><strong className="text-[var(--color-expense)]">{formatMoney(item.despesas)}</strong></p>
        <p className="flex items-center justify-between gap-8"><span className="text-muted-foreground">Saldo</span><strong className="text-[var(--color-balance)]">{formatMoney(item.saldo)}</strong></p>
      </div>
    </div>
  );
}

function ChartLegend({ hiddenSeries, onToggle }: { hiddenSeries: Record<ChartSeries, boolean>; onToggle: (series: ChartSeries) => void }) {
  const items: { id: ChartSeries; label: string; className: string }[] = [
    { id: "receitas", label: "Receitas", className: "bg-chart-revenue" },
    { id: "despesas", label: "Despesas", className: "bg-chart-expense" },
    { id: "saldo", label: "Saldo", className: "bg-chart-balance" },
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => onToggle(item.id)} className={cn("inline-flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35", hiddenSeries[item.id] && "opacity-45")} aria-pressed={!hiddenSeries[item.id]}>
          <span className={cn(item.id === "saldo" ? "h-0.5 w-4 rounded-full" : "size-2.5 rounded-full", item.className)} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

function QuickActionsCard({ onNavigate }: { onNavigate: (to: string) => void }) {
  const actions = [
    { label: "Novo lançamento", description: "Registre uma nova receita ou despesa", icon: Plus, to: "/app/financeiro/lancamentos", tone: "bg-[var(--purple-soft)] text-[var(--purple-600)]" },
    { label: "Nova conta a pagar", description: "Adicione uma nova conta para pagamento", icon: CreditCard, to: "/app/financeiro/contas-pagar", tone: "bg-[var(--blue-soft)] text-[var(--blue-600)]" },
    { label: "Emitir relatório", description: "Gere relatórios financeiros", icon: FileBarChart, to: "/app/relatorios", tone: "bg-[var(--green-soft)] text-[var(--green-600)]" },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-extrabold text-foreground">Atalhos rápidos</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pt-0">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => onNavigate(action.to)}
              className="group flex min-h-[68px] w-full items-center gap-4 rounded-[16px] border border-border bg-card px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", action.tone)}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground">{action.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{action.description}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RecentMovementsTable({ entries }: { entries: FinancialEntryRow[] }) {
  const rows = entries.slice(0, 3);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-extrabold">Últimas movimentações</CardTitle>
        <Button variant="outline" size="sm">Ver todas</Button>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-10">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry) => {
                const receita = entry.type === "receita";
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.description}</TableCell>
                    <TableCell><Badge className={cn("border-transparent", receita ? "bg-success-light text-success" : "bg-[var(--orange-soft)] text-[var(--orange-600)]")}>{entry.categoryName || (receita ? "Receita" : "Despesa")}</Badge></TableCell>
                    <TableCell className={cn("font-medium", receita ? "text-success" : "text-[var(--orange-600)]")}>{receita ? "↑ Receita" : "↓ Despesa"}</TableCell>
                    <TableCell className={cn("font-bold tabular-nums", receita ? "text-success" : "text-[var(--orange-600)]")}>{formatMoney(entry.amount)}</TableCell>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell><MoreVertical className="size-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhuma movimentação encontrada.</div>
        )}
        <button type="button" className="mx-auto mt-4 flex items-center gap-2 text-sm font-bold text-primary">Ver todas as movimentações <ChevronRight className="size-4" /></button>
      </CardContent>
    </Card>
  );
}

function AccountsPayableTable({ entries }: { entries: AccountPayableRow[] }) {
  const rows = entries.slice(0, 3);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-extrabold">Contas a pagar</CardTitle>
        <Button variant="outline" size="sm">Ver todas</Button>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length ? (
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
              {rows.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.description}</TableCell>
                  <TableCell>{formatDate(entry.dueDate)}</TableCell>
                  <TableCell className="font-bold tabular-nums">{formatMoney(entry.amount)}</TableCell>
                  <TableCell><Badge className="border-transparent bg-[var(--orange-soft)] text-[var(--orange-600)]">{entry.status === "paid" ? "Pago" : entry.status === "overdue" ? "Vencido" : entry.status === "cancelled" ? "Cancelado" : "Pendente"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhuma conta a pagar encontrada.</div>
        )}
        <button type="button" className="mx-auto mt-4 flex items-center gap-2 text-sm font-bold text-primary">Ver todas as contas a pagar <ChevronRight className="size-4" /></button>
      </CardContent>
    </Card>
  );
}

export function Component() {
  const navigate = useNavigate();
  const { data: kpis, isLoading, isError, refetch } = useDashboardKpis();
  const { data: entries = [] } = useFinancialEntries();
  const { data: payables = [] } = useAccountsPayable();
  const cashFlowRange = useMemo(() => getDashboardCashFlowRange(), []);
  const { data: cashFlowRows } = useCashFlow("month", cashFlowRange.start, cashFlowRange.end);
  const timedOut = useDataTimeout(isLoading);
  const [hiddenSeries, setHiddenSeries] = useState<Record<ChartSeries, boolean>>({ receitas: false, despesas: false, saldo: false });

  const saldo = kpis?.saldo ?? 0;
  const totalReceitas = kpis?.totalReceitas ?? 0;
  const totalDespesas = kpis?.totalDespesas ?? 0;
  const contasPagas = kpis ? (kpis.contasPagasMes ?? 0) + (kpis.contasRecebidasMes ?? 0) : null;
  const pendenciaData = useMemo(() => {
    const contasAVencer = kpis?.contasAVencer ?? 0;
    const contasVencidas = kpis?.contasVencidas ?? 0;
    const contasAReceber = kpis?.contasAReceber ?? 0;
    const contasReceberVencidas = kpis?.contasReceberVencidas ?? 0;
    return {
      total: contasAVencer + contasVencidas + contasAReceber + contasReceberVencidas,
      overdue: contasVencidas + contasReceberVencidas,
    };
  }, [kpis]);

  const chartData = useMemo(
    () => buildFinancialChartData(cashFlowRows as CashFlowApiRow[] | undefined, cashFlowRange.start),
    [cashFlowRange.start, cashFlowRows],
  );
  const kpiSeries = useMemo(() => ({
    faturamento: chartData.map((item) => item.receitas),
    lucro: chartData.map((item) => item.saldo),
    contasPagas: chartData.map((_item, index) => (index === chartData.length - 1 ? contasPagas ?? 0 : 0)),
  }), [chartData, contasPagas]);

  function toggleSeries(series: ChartSeries) {
    setHiddenSeries((current) => ({ ...current, [series]: !current[series] }));
  }

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5 px-4 pb-8 pt-6 sm:px-6 lg:px-7 xl:px-8">
      <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">Visão executiva para acompanhar caixa, lucro, despesas e pendências.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="h-11 rounded-xl bg-card px-4">
            {formatLongDate()}
            <CalendarDays className="size-4" />
          </Button>
          <Button variant="outline" className="h-11 rounded-xl bg-card px-4">
            <Filter className="size-4" />
            Filtros
          </Button>
        </div>
      </header>

      {isLoading && !timedOut ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(360px,1.05fr)_minmax(0,1.95fr)]">
          <Card><CardContent className="h-[360px] animate-pulse bg-muted/50" /></Card>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <Card key={index}><CardContent className="h-[260px] animate-pulse bg-muted/50" /></Card>)}
          </div>
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="font-bold text-foreground">Não foi possível carregar os KPIs.</p>
            <p className="text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
            <Button type="button" onClick={() => void refetch()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(360px,0.98fr)_minmax(0,1.98fr)]">
          <Card className="overflow-hidden border-0 bg-transparent shadow-none">
            <CardContent className="p-0">
              <div className="relative min-h-[300px] overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.16),transparent_9rem),linear-gradient(135deg,var(--navy-900)_0%,#073B78_55%,#0B63C7_100%)] p-6 text-white shadow-[0_24px_55px_rgba(6,26,58,0.26)] lg:p-7">
                <div className="absolute -right-20 -top-20 size-56 rounded-full bg-white/10" />
                <div className="absolute bottom-20 right-7 w-44 opacity-80">
                  <SparklineChart data={chartData.map((item) => item.saldo)} color="blue" />
                </div>
                <div className="relative z-10 flex min-h-[246px] flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-extrabold">Cartão financeiro</p>
                      <p className="mt-1 text-sm text-white/78">Resumo do caixa financeiro.</p>
                    </div>
                    <span className="rounded-full bg-success/25 px-4 py-1.5 text-xs font-bold text-emerald-100 ring-1 ring-white/15">Ativo</span>
                  </div>
                  <div className="mt-8">
                    <p className="text-xl font-extrabold">Artec Gestão</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/75">Conta financeira</p>
                  </div>
                  <div className="mt-auto">
                    <p className="text-sm text-white/72">Saldo atual</p>
                    <p className="mt-2 text-4xl font-extrabold tracking-tight tabular-nums">{formatMoney(saldo)}</p>
                  </div>
                  <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                    <div className="p-4">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase text-white/70"><ArrowUpCircle className="size-4 text-[var(--green-500)]" />Receitas</p>
                      <p className="mt-2 font-extrabold tabular-nums">{formatMoney(totalReceitas)}</p>
                    </div>
                    <div className="border-l border-white/10 p-4">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase text-white/70"><ArrowDownCircle className="size-4 text-[var(--orange-500)]" />Despesas</p>
                      <p className="mt-2 font-extrabold tabular-nums">{formatMoney(totalDespesas)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-4 text-lg font-extrabold text-foreground">Resumo financeiro</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard title="Faturamento" value={formatMoney(totalReceitas)} icon={Banknote} tone="green" delta={getSeriesDelta(kpiSeries.faturamento)} sparklineData={kpiSeries.faturamento} />
              <KpiCard title="Lucro" value={formatMoney(saldo)} icon={TrendingUp} tone="blue" delta={getSeriesDelta(kpiSeries.lucro)} sparklineData={kpiSeries.lucro} />
              <KpiCard title="Contas pagas" value={timedOut && !kpis ? "—" : String(contasPagas ?? 0)} icon={ReceiptText} tone="orange" sparklineData={kpiSeries.contasPagas} />
              <PendingKpiCard total={pendenciaData.total} overdue={pendenciaData.overdue} />
            </div>
          </div>
        </section>
      )}

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(360px,1fr)]">
        <Card className="min-w-0">
          <CardHeader className="gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-extrabold">Resumo financeiro</CardTitle>
            <ChartLegend hiddenSeries={hiddenSeries} onToggle={toggleSeries} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[292px] min-w-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ left: 54, right: 18, top: 18, bottom: 6 }} barGap={8}>
                  <defs>
                    <linearGradient id="saldoAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-balance)" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="var(--chart-balance)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="color-mix(in srgb, var(--border) 54%, transparent)" />
                  <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickMargin={8} tickFormatter={(v: number) => formatCompactMoney(v)} />
                  <Tooltip content={(props) => <FinancialTooltip active={props.active} payload={props.payload as ChartPayload[] | undefined} />} />
                  {!hiddenSeries.saldo ? <Area type="monotone" dataKey="saldo" fill="url(#saldoAreaGradient)" stroke="none" /> : null}
                  {!hiddenSeries.receitas ? <Bar dataKey="receitas" name="Receitas" fill="var(--chart-revenue)" fillOpacity={0.92} radius={[7, 7, 0, 0]} maxBarSize={40} /> : null}
                  {!hiddenSeries.despesas ? <Bar dataKey="despesas" name="Despesas" fill="var(--chart-expense)" fillOpacity={0.9} radius={[7, 7, 0, 0]} maxBarSize={40} /> : null}
                  {!hiddenSeries.saldo ? <Line type="monotone" dataKey="saldo" name="Saldo" stroke="var(--chart-balance)" strokeWidth={3.2} dot={{ r: 4, strokeWidth: 2, stroke: "var(--card)", fill: "var(--chart-balance)" }} activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--card)" }} /> : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <QuickActionsCard onNavigate={navigate} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <RecentMovementsTable entries={entries} />
        <AccountsPayableTable entries={payables} />
      </section>
    </div>
  );
}
