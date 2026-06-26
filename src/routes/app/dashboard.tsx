import { useMemo } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MetricCard, PageShell } from "@/components/layout/page-shell";
import { useDashboardKpis } from "@/domain/financeiro/hooks/use-dashboard-kpis";
import { formatMoney } from "@/lib/utils";

const chartData = [
  { mes: "Jan", receitas: 42000, despesas: 26000 },
  { mes: "Fev", receitas: 46000, despesas: 29000 },
  { mes: "Mar", receitas: 51000, despesas: 31000 },
  { mes: "Abr", receitas: 48000, despesas: 30000 },
  { mes: "Mai", receitas: 57000, despesas: 33000 },
  { mes: "Jun", receitas: 62000, despesas: 35000 },
];

const PENDING_TONE_STYLES = {
  warning: { bg: "bg-warning/15", icon: "text-warning", ring: "ring-warning/20" },
  danger: { bg: "bg-destructive/15", icon: "text-destructive", ring: "ring-destructive/20" },
  success: { bg: "bg-success/15", icon: "text-success", ring: "ring-success/20" },
} as const;

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
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">{value}</p>
            {details?.length ? (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
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
          </div>
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg ring-1", styles.bg, styles.icon, styles.ring)}>
            <Icon className="size-5" />
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}

function StatisticBar({ icon: Icon, label, value, tone }: { icon: typeof ArrowUpCircle; label: string; value: number; tone: "green" | "orange" | "blue" }) {
  const colors = {
    green: { icon: "bg-success/15 text-success", bar: "bg-success" },
    orange: { icon: "bg-warning/15 text-warning", bar: "bg-warning" },
    blue: { icon: "bg-info/15 text-info", bar: "bg-info" },
  };

  return (
    <div className="grid grid-cols-[2.75rem_1fr_3rem] items-center gap-4">
      <div className={cn("flex size-11 items-center justify-center rounded-md", colors[tone].icon)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-all duration-500", colors[tone].bar, percentWidthClass(value))} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      </div>
      <div className="text-right text-xl font-bold tabular-nums text-foreground">{value}%</div>
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
  const { data: kpis, isLoading } = useDashboardKpis();
  const saldo = kpis?.saldo ?? 0;
  const totalReceitas = kpis?.totalReceitas ?? 0;
  const totalDespesas = kpis?.totalDespesas ?? 0;
  const totalMovimentado = Math.max(totalReceitas + totalDespesas, 1);
  const receitaPercent = Math.round((totalReceitas / totalMovimentado) * 100);
  const despesaPercent = Math.round((totalDespesas / totalMovimentado) * 100);
  const saldoPercent = Math.min(Math.round((Math.abs(saldo) / totalMovimentado) * 100), 100);

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

  const shortcuts = [
    { label: "Novo lancamento", to: "/app/financeiro/lancamentos" },
    { label: "Nova conta a pagar", to: "/app/financeiro/contas-pagar" },
    { label: "Emitir relatorio", to: "/app/relatorios" },
  ];

  return (
    <PageShell
      icon={LayoutDashboard}
      title="Dashboard"
      subtitle="Visao executiva para decidir rapido: caixa, lucro, despesas e pendencias."
    >
      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card className="overflow-hidden">
            <CardContent className="space-y-6 p-5 sm:p-6">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-64 animate-pulse rounded-lg bg-muted" />
              <div className="h-2 animate-pulse rounded-full bg-muted" />
            </CardContent>
          </Card>
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card className="overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-foreground">Cartao financeiro</p>
                  <p className="text-sm text-muted-foreground">Resumo do caixa financeiro</p>
                </div>
                <CreditCard className="size-5 text-primary shrink-0" />
              </div>
              <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-white shadow-[0_26px_52px_-32px_var(--primary)] sm:p-7">
                <div className="absolute -right-16 -top-14 size-40 rounded-full bg-white/16" />
                <div className="absolute -bottom-20 right-8 size-44 rounded-full bg-white/14" />
                <div className="relative flex flex-col gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-bold">Artec Gestao</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/65">Conta financeira</p>
                    </div>
                    <span className="rounded-md bg-white/16 px-3 py-1 text-xs font-semibold text-white/80 shrink-0">Ativo</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/70">Saldo atual</p>
                    <p className="mt-1.5 text-3xl font-bold tabular-nums sm:text-4xl">{formatMoney(saldo)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-white/8 p-4 text-sm">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Receitas</p>
                      <p className="mt-1 font-semibold tabular-nums">{formatMoney(totalReceitas)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Despesas</p>
                      <p className="mt-1 font-semibold tabular-nums">{formatMoney(totalDespesas)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Participacao das receitas</span>
                  <span className="font-semibold tabular-nums text-foreground">{receitaPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full bg-primary transition-all duration-500", percentWidthClass(receitaPercent))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Pendencias</h2>
                {pendenciaData.totalVencidas > 0 ? (
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-destructive/15 text-xs font-bold text-destructive">
                    {pendenciaData.totalVencidas}
                  </span>
                ) : null}
              </div>

              {pendenciaData.totalPagar === 0 && pendenciaData.totalReceber === 0 ? (
                <Card className="overflow-hidden">
                  <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-success/15 text-success">
                      <TrendingUp className="size-6" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Nenhuma pendencia</p>
                    <p className="text-xs text-muted-foreground">Todas as contas estao em dia.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
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

            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard title="Faturamento" value={formatMoney(totalReceitas)} icon={ArrowUpCircle} tone="green" helper="Receitas registradas" />
              <MetricCard title="Lucro" value={formatMoney(saldo)} icon={Banknote} tone={saldo < 0 ? "red" : "blue"} helper="Receitas - despesas" />
              <MetricCard title="Contas Pagas" value={String((kpis?.contasPagasMes ?? 0) + (kpis?.contasRecebidasMes ?? 0))} icon={TrendingUp} tone="blue" helper="Pagas e recebidas no mes" />
            </div>
          </div>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-5 text-primary" />
              Resumo financeiro
            </CardTitle>
            <div className="flex gap-3 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-success" />
                Receitas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-destructive" />
                Despesas
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-6 sm:p-6 sm:pt-6">
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -15, right: 8, top: 8, bottom: 4 }}>
                  <defs>
                    <linearGradient id="receitasGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="despesasGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in srgb, var(--border) 72%, transparent)" />
                  <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickMargin={8} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickMargin={8} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      boxShadow: "var(--shadow-soft)",
                    }}
                    formatter={(value: number) => formatMoney(value)}
                  />
                  <Area type="monotone" dataKey="receitas" stroke="var(--success)" fill="url(#receitasGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="despesas" stroke="var(--destructive)" fill="url(#despesasGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="size-5 text-primary" />
              Atalhos rapidos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5">
            {shortcuts.map((item, index) => (
              <Button key={item.label} variant={index === 0 ? "default" : "outline"} className="min-h-12 w-full justify-start gap-3" onClick={() => navigate(item.to)}>
                <span className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-md",
                  index === 0 ? "bg-white/20" : "bg-muted",
                )}>
                  <Plus className={cn("size-4", index === 0 ? "text-[#3f4147]" : "text-primary")} />
                </span>
                {item.label}
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
            {["Lancamentos aguardando integracao", "Contas a pagar sem vencimentos cadastrados", "Relatorios pendentes de revisao"].length ? (
              <div className="space-y-1">
                {["Lancamentos aguardando integracao", "Contas a pagar sem vencimentos cadastrados", "Relatorios pendentes de revisao"].map((item) => (
                  <div key={item} className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-0">
                    <span className="text-sm text-foreground">{item}</span>
                    <Badge variant="secondary" className="shrink-0">Pendente</Badge>
                  </div>
                ))}
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
              Estatisticas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-5">
              <StatisticBar icon={ArrowUpCircle} label="Receitas" value={receitaPercent} tone="green" />
              <StatisticBar icon={ArrowDownCircle} label="Despesas" value={despesaPercent} tone="orange" />
              <StatisticBar icon={TrendingUp} label="Saldo" value={saldoPercent} tone="blue" />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
