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
  Plus,
  ReceiptText,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SparklineChart } from "@/components/dashboard/SparklineChart";
import { useAccountsPayable } from "@/domain/financeiro/hooks/use-accounts";
import { useCashFlow } from "@/domain/financeiro/hooks/use-cash-flow";
import { useDashboardKpis } from "@/domain/financeiro/hooks/use-dashboard-kpis";
import { useFinancialEntries } from "@/domain/financeiro/hooks/use-financial-entries";
import type { AccountPayableRow, FinancialEntryRow } from "@/domain/financeiro/types";
import { cn, formatMoney, toFiniteNumber } from "@/lib/utils";
import { formatCompactMoney } from "./dashboard-utils";
import { pageHeaderStyles } from "@/components/layout/page-shell";

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
    if (!isLoading) { setTimedOut(false); return; }
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
    return <span className="text-xs font-medium text-text-muted">Sem dados</span>;
  }
  const positive = value >= 0;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-bold", positive ? "text-success" : "text-danger")}>
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
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone: "green" | "blue" | "orange";
  delta?: number;
  sparklineData: number[];
}) {
  const iconColors: Record<string, string> = {
    green: "bg-success-soft text-success",
    blue: "bg-primary-soft text-primary",
    orange: "bg-warning-soft text-warning",
  };
  const sparklineColor = tone === "orange" ? "red" : tone;

  return (
    <section className="metric-card card-hover">
      <div>
        <div className={cn("metric-icon", iconColors[tone])}>
          <Icon />
        </div>
        <div>
          <p className="metric-title">{title}</p>
          <strong className="metric-value">{value}</strong>
        </div>
      </div>
      <div>
        <div className="metric-trend">
          <DeltaBadge value={delta} />
          <small>vs. mês anterior</small>
        </div>
        <div className="h-10 mt-2">
          <SparklineChart data={sparklineData.length ? sparklineData : [0, 0, 0, 0, 0, 0]} color={sparklineColor} />
        </div>
      </div>
    </section>
  );
}

function PendingKpiCard({ total, overdue }: { total: number; overdue: number }) {
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
        <p className={cn("flex items-center gap-1.5 text-sm font-bold", hasPending ? "text-warning" : "text-success")}>
          <CheckCircle2 className="size-4" />
          {hasPending ? `${overdue} vencidas` : "Tudo em dia"}
        </p>
        <p className="text-xs text-text-secondary mt-1">
          {hasPending ? "Revise as contas pendentes no financeiro." : "Todas as contas estão dentro do prazo."}
        </p>
      </div>
    </section>
  );
}

type ChartPayload = { payload?: { receitas: number; despesas: number; saldo: number; mes: string } };

function FinancialTooltip({ active, payload }: { active?: boolean; payload?: ChartPayload[] }) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 text-xs text-text-primary shadow-card">
      <p className="mb-2 font-bold text-text-primary">{item.mes}</p>
      <div className="space-y-1.5">
        <p className="flex items-center justify-between gap-8"><span className="text-text-secondary">Receitas</span><strong className="text-success">{formatMoney(item.receitas)}</strong></p>
        <p className="flex items-center justify-between gap-8"><span className="text-text-secondary">Despesas</span><strong className="text-danger">{formatMoney(item.despesas)}</strong></p>
        <p className="flex items-center justify-between gap-8"><span className="text-text-secondary">Saldo</span><strong className="text-primary">{formatMoney(item.saldo)}</strong></p>
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
    <div className="chart-legend">
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => onToggle(item.id)} className={cn("inline-flex items-center gap-2", hiddenSeries[item.id] && "opacity-45")} aria-pressed={!hiddenSeries[item.id]}>
          <span className={cn(item.id === "saldo" ? "legend-line" : "legend-dot", item.className)} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

function FinancialHeroCard({ balance, revenue, expenses }: { balance: number; revenue: number; expenses: number }) {
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
          <span className="financial-mini-label financial-income">Receitas</span>
          <strong>{formatMoney(revenue)}</strong>
        </div>
        <div>
          <span className="financial-mini-label financial-expense">Despesas</span>
          <strong>{formatMoney(expenses)}</strong>
        </div>
      </div>
    </section>
  );
}

function QuickActionsCard({ onNavigate }: { onNavigate: (to: string) => void }) {
  const actions = [
    { label: "Novo lançamento", description: "Registre receita ou despesa", icon: Plus, to: "/app/financeiro/lancamentos", tone: "purple" as const },
    { label: "Nova conta a pagar", description: "Adicione conta para pagamento", icon: CreditCard, to: "/app/financeiro/contas-pagar", tone: "blue" as const },
    { label: "Emitir relatório", description: "Gere relatórios financeiros", icon: FileBarChart, to: "/app/relatorios", tone: "green" as const },
  ];

  return (
    <section className="quick-actions-card">
      <h2>Atalhos rápidos</h2>
      <div className="quick-actions-list">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.label} type="button" onClick={() => onNavigate(action.to)} className="quick-action-card">
              <div className="quick-action-left">
                <div className={`quick-action-icon quick-action-icon-${action.tone}`}>
                  <Icon />
                </div>
                <div>
                  <strong>{action.label}</strong>
                  <p>{action.description}</p>
                </div>
              </div>
              <ChevronRight className="quick-action-chevron" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RecentMovementsTable({ entries }: { entries: FinancialEntryRow[] }) {
  const rows = entries.slice(0, 4);
  return (
    <section className="table-card">
      <div className="table-card-header">
        <h2>Últimas movimentações</h2>
        <Button variant="ghost" size="sm" className="text-primary font-bold">Ver todas</Button>
      </div>
      {rows.length ? (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => {
                const receita = entry.type === "receita";
                return (
                  <tr key={entry.id}>
                    <td className="font-medium">{entry.description}</td>
                    <td><Badge variant={receita ? "success" : "warning"}>{entry.categoryName || (receita ? "Receita" : "Despesa")}</Badge></td>
                    <td className={cn("font-medium", receita ? "text-success" : "text-danger")}>{receita ? "↑ Receita" : "↓ Despesa"}</td>
                    <td className={cn("font-bold", receita ? "text-success" : "text-danger")}>{formatMoney(entry.amount)}</td>
                    <td className="text-text-secondary">{formatDate(entry.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">Nenhuma movimentação encontrada.</div>
      )}
      <button type="button" className="table-footer-link">Ver todas as movimentações <ChevronRight className="size-4" /></button>
    </section>
  );
}

function AccountsPayableTable({ entries }: { entries: AccountPayableRow[] }) {
  const rows = entries.slice(0, 4);
  const badgeMap: Record<string, "warning" | "success" | "destructive" | "default"> = {
    paid: "success",
    overdue: "destructive",
    cancelled: "default",
    pending: "warning",
  };
  const labelMap: Record<string, string> = {
    paid: "Pago",
    overdue: "Vencido",
    cancelled: "Cancelado",
    pending: "Pendente",
  };
  return (
    <section className="table-card">
      <div className="table-card-header">
        <h2>Contas a pagar</h2>
        <Button variant="ghost" size="sm" className="text-primary font-bold">Ver todas</Button>
      </div>
      {rows.length ? (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.id}>
                  <td className="font-medium">{entry.description}</td>
                  <td className="text-text-secondary">{formatDate(entry.dueDate)}</td>
                  <td className="font-bold">{formatMoney(entry.amount)}</td>
                  <td><Badge variant={badgeMap[entry.status] ?? "default"}>{labelMap[entry.status] ?? entry.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">Nenhuma conta a pagar encontrada.</div>
      )}
      <button type="button" className="table-footer-link">Ver todas as contas a pagar <ChevronRight className="size-4" /></button>
    </section>
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
  const pendenciaData = useMemo(() => ({
    total: (kpis?.contasAVencer ?? 0) + (kpis?.contasVencidas ?? 0) + (kpis?.contasAReceber ?? 0) + (kpis?.contasReceberVencidas ?? 0),
    overdue: (kpis?.contasVencidas ?? 0) + (kpis?.contasReceberVencidas ?? 0),
  }), [kpis]);

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
    <>
      <style>{pageHeaderStyles}</style>
      <style>{dashboardStyles}</style>
      <div className="dashboard-page">
        <header className="page-header">
          <div>
            <h1 className="page-header-title">Dashboard</h1>
            <p className="page-header-desc">Visão executiva para acompanhar caixa, lucro, despesas e pendências.</p>
          </div>
          <div className="page-header-actions">
            <Button variant="outline">
              {formatLongDate()}
              <CalendarDays className="size-4" />
            </Button>
            <Button variant="outline">
              <Filter className="size-4" />
              Filtros
            </Button>
          </div>
        </header>

        {isLoading && !timedOut ? (
          <div className="dashboard-top-grid">
            <Card><CardContent className="h-[330px] animate-pulse bg-surface-muted rounded-[20px]" /></Card>
            <div className="dashboard-metrics-grid">
              {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="h-[292px] animate-pulse bg-surface-muted rounded-[20px]" /></Card>)}
            </div>
          </div>
        ) : isError ? (
          <Card elevated>
            <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="font-bold text-text-primary">Não foi possível carregar os KPIs.</p>
              <p className="text-sm text-text-secondary">Verifique sua conexão e tente novamente.</p>
              <Button onClick={() => void refetch()}>Tentar novamente</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="dashboard-top-grid">
              <FinancialHeroCard balance={saldo} revenue={totalReceitas} expenses={totalDespesas} />

              <div className="dashboard-kpi-panel">
                <h2>Resumo financeiro</h2>
                <div className="dashboard-metrics-grid">
                  <KpiCard title="Faturamento" value={formatMoney(totalReceitas)} icon={Banknote} tone="green" delta={getSeriesDelta(kpiSeries.faturamento)} sparklineData={kpiSeries.faturamento} />
                  <KpiCard title="Lucro" value={formatMoney(saldo)} icon={TrendingUp} tone="blue" delta={getSeriesDelta(kpiSeries.lucro)} sparklineData={kpiSeries.lucro} />
                  <KpiCard title="Contas pagas" value={timedOut && !kpis ? "—" : String(contasPagas ?? 0)} icon={ReceiptText} tone="orange" sparklineData={kpiSeries.contasPagas} />
                  <PendingKpiCard total={pendenciaData.total} overdue={pendenciaData.overdue} />
                </div>
              </div>
            </div>

            <div className="dashboard-middle-grid">
              <section className="chart-card">
                <div className="chart-card-header">
                  <h2>Resumo financeiro</h2>
                  <ChartLegend hiddenSeries={hiddenSeries} onToggle={toggleSeries} />
                </div>
                <div className="chart-card-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ left: 54, right: 18, top: 18, bottom: 6 }} barGap={8}>
                      <defs>
                        <linearGradient id="saldoAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-balance)" stopOpacity={0.16} />
                          <stop offset="100%" stopColor="var(--chart-balance)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="color-mix(in srgb, var(--border) 54%, transparent)" />
                      <XAxis dataKey="mes" stroke="var(--color-text-muted)" fontSize={12} tickMargin={10} />
                      <YAxis stroke="var(--color-text-muted)" fontSize={12} tickMargin={8} tickFormatter={(v: number) => formatCompactMoney(v)} />
                      <Tooltip content={(props) => <FinancialTooltip active={props.active} payload={props.payload as ChartPayload[] | undefined} />} />
                      {!hiddenSeries.saldo ? <Area type="monotone" dataKey="saldo" fill="url(#saldoAreaGradient)" stroke="none" /> : null}
                      {!hiddenSeries.receitas ? <Bar dataKey="receitas" name="Receitas" fill="var(--chart-revenue)" fillOpacity={0.92} radius={[7, 7, 0, 0]} maxBarSize={40} /> : null}
                      {!hiddenSeries.despesas ? <Bar dataKey="despesas" name="Despesas" fill="var(--chart-expense)" fillOpacity={0.9} radius={[7, 7, 0, 0]} maxBarSize={40} /> : null}
                      {!hiddenSeries.saldo ? <Line type="monotone" dataKey="saldo" name="Saldo" stroke="var(--chart-balance)" strokeWidth={3.2} dot={{ r: 4, strokeWidth: 2, stroke: "var(--card)", fill: "var(--chart-balance)" }} activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--card)" }} /> : null}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <QuickActionsCard onNavigate={navigate} />
            </div>

            <div className="dashboard-bottom-grid">
              <RecentMovementsTable entries={entries} />
              <AccountsPayableTable entries={payables} />
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
}

.dashboard-top-grid {
  display: grid;
  grid-template-columns: minmax(360px, 0.92fr) minmax(640px, 1.58fr);
  gap: 22px;
  align-items: stretch;
}

.dashboard-kpi-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dashboard-kpi-panel > h2 {
  margin: 4px 0 0;
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 850;
  letter-spacing: -0.025em;
}

.dashboard-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.dashboard-middle-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.95fr);
  gap: 22px;
}

.dashboard-bottom-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

@media (max-width: 1279px) {
  .dashboard-top-grid { grid-template-columns: 1fr; }
  .dashboard-metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dashboard-middle-grid,
  .dashboard-bottom-grid { grid-template-columns: 1fr; }
}

@media (max-width: 639px) {
  .dashboard-metrics-grid { grid-template-columns: 1fr; }
}

/* Financial Hero Card */
.financial-hero-card {
  min-height: 338px;
  padding: 26px 28px;
  border-radius: 24px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 85% 10%, rgba(96, 165, 250, 0.38), transparent 170px),
    linear-gradient(135deg, #03152e 0%, #06244a 48%, #0f4fa8 100%);
  box-shadow: 0 24px 58px rgba(6, 26, 56, 0.28);
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
  font-weight: 850;
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
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
}

.financial-hero-body {
  position: relative;
  z-index: 1;
  margin-top: 32px;
}

.financial-company {
  margin: 0;
  font-size: 20px;
  font-weight: 850;
}

.financial-label {
  margin: 4px 0 28px;
  font-size: 12px;
  font-weight: 800;
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
  font-size: 34px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: -0.05em;
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
  font-weight: 800;
  text-transform: uppercase;
}

.financial-income {
  color: #86efac;
}

.financial-expense {
  color: #fdba74;
}

.financial-hero-footer strong {
  font-size: 16px;
  font-weight: 850;
}

/* Metric Cards */
.metric-card {
  min-height: 302px;
  padding: 22px;
  border-radius: 18px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  margin-bottom: 12px;
}

.metric-icon svg {
  width: 22px;
  height: 22px;
}

.metric-title {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 600;
}

.metric-value {
  display: block;
  margin-top: 8px;
  color: var(--color-text-primary);
  font-size: 24px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.metric-trend {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.metric-trend small {
  color: var(--color-text-muted);
}

/* Chart card */
.chart-card {
  min-height: 342px;
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
  font-weight: 850;
  color: var(--color-text-primary);
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 18px;
  color: var(--color-text-secondary);
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
  min-height: 262px;
}

/* Quick actions */
.quick-actions-card {
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
  font-weight: 850;
  color: var(--color-text-primary);
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
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
  font-weight: 850;
  color: var(--color-text-primary);
}

.quick-action-left p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.quick-action-chevron {
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* Table cards */
.table-card {
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
  font-weight: 850;
  color: var(--color-text-primary);
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

.data-table thead th {
  padding: 13px 16px;
  background: var(--color-surface-soft);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 800;
  text-align: left;
  white-space: nowrap;
}

.data-table thead th:first-child {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

.data-table thead th:last-child {
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}

.data-table tbody td {
  padding: 15px 16px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
  vertical-align: middle;
}

.data-table tbody tr {
  transition: background-color 160ms ease;
}

.data-table tbody tr:hover {
  background: var(--color-surface-muted);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.table-footer-link {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
}
`;
