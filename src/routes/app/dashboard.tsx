import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CalendarCheck,
  Clock3,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Plus,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState, MetricCard, PageShell } from "@/components/layout/page-shell";
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

export function Component() {
  const navigate = useNavigate();
  const { data: kpis, isLoading } = useDashboardKpis();
  const saldo = kpis?.saldo ?? 0;
  const contasAPagar = (kpis?.contasAVencer ?? 0) + (kpis?.contasVencidas ?? 0);
  const totalReceitas = kpis?.totalReceitas ?? 0;
  const totalDespesas = kpis?.totalDespesas ?? 0;
  const totalMovimentado = Math.max(totalReceitas + totalDespesas, 1);
  const receitaPercent = Math.round((totalReceitas / totalMovimentado) * 100);
  const despesaPercent = Math.round((totalDespesas / totalMovimentado) * 100);
  const saldoPercent = Math.min(Math.round((Math.abs(saldo) / totalMovimentado) * 100), 100);
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
        <LoadingState label="Atualizando indicadores..." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.08fr_1fr]">
          <Card className="overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-foreground">Cartao financeiro</p>
                  <p className="text-sm text-muted-foreground">Resumo do caixa financeiro</p>
                </div>
                <CreditCard className="size-5 text-primary" />
              </div>
              <div className="relative min-h-64 overflow-hidden rounded-lg bg-primary p-6 text-white shadow-[0_26px_52px_-32px_var(--primary)] sm:p-7">
                <div className="absolute -right-16 -top-14 size-40 rounded-full bg-white/16" />
                <div className="absolute -bottom-20 right-8 size-44 rounded-full bg-white/14" />
                <div className="relative flex h-full min-h-52 flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-bold">Artec Gestao</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase text-white/65">Conta financeira</p>
                    </div>
                    <span className="rounded-md bg-white/16 px-3 py-1 text-xs font-semibold text-white/80">Ativo</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Saldo atual</p>
                    <p className="mt-2 text-3xl font-bold tabular-nums sm:text-4xl">{formatMoney(saldo)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] uppercase text-white/60">Receitas</p>
                      <p className="mt-1 font-semibold tabular-nums">{formatMoney(totalReceitas)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-white/60">Despesas</p>
                      <p className="mt-1 font-semibold tabular-nums">{formatMoney(totalDespesas)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full bg-primary ${percentWidthClass(receitaPercent)}`} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Participacao das receitas</span>
                  <span className="font-semibold tabular-nums text-foreground">{receitaPercent}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Pendencias</h2>
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-warning text-sm font-bold text-[#3f4147]">+</span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="overflow-hidden">
                  <CardContent className="p-5">
                    <p className="text-2xl font-bold tabular-nums text-foreground">{contasAPagar}</p>
                    <p className="text-sm text-muted-foreground">{kpis?.contasVencidas ?? 0} vencidas</p>
                    <div className="mt-8 flex items-end justify-between">
                      <Clock3 className="size-7 text-warning" />
                      <span className="text-sm font-semibold text-foreground">A pagar</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-5">
                    <p className="text-2xl font-bold tabular-nums text-foreground">{kpis?.contasRecebidasMes ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Recebidas no mes</p>
                    <div className="mt-8 flex items-end justify-between">
                      <ShoppingCart className="size-7 text-success" />
                      <span className="text-sm font-semibold text-foreground">A receber</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-5">
                    <p className="text-2xl font-bold tabular-nums text-foreground">{despesaPercent}%</p>
                    <p className="text-sm text-muted-foreground">Peso das despesas</p>
                    <div className="mt-8 flex items-end justify-between">
                      <ArrowDownCircle className="size-7 text-destructive" />
                      <span className="text-sm font-semibold text-foreground">Custos</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              <MetricCard title="Faturamento" value={formatMoney(totalReceitas)} icon={ArrowUpCircle} tone="green" helper="Receitas registradas" />
              <MetricCard title="Lucro" value={formatMoney(saldo)} icon={Banknote} tone={saldo < 0 ? "red" : "blue"} helper="Receitas - despesas" />
              <MetricCard title="A receber" value={String(kpis?.contasRecebidasMes ?? 0)} icon={CalendarCheck} tone="green" helper="Recebidas no mes" />
            </div>
          </div>
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[1.45fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-5 text-primary" />
              Resumo financeiro
            </CardTitle>
            <div className="flex gap-2 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" />
                Receitas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-destructive" />
                Despesas
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-72 pt-6 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in srgb, var(--border) 72%, transparent)" />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Area type="monotone" dataKey="receitas" stroke="var(--success)" fill="var(--success)" fillOpacity={0.13} />
                <Area type="monotone" dataKey="despesas" stroke="var(--destructive)" fill="var(--destructive)" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="size-5 text-primary" />
              Atalhos rapidos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5 md:grid-cols-2 xl:grid-cols-1">
            {shortcuts.map((item, index) => (
              <Button key={item.label} variant={index === 0 ? "default" : "outline"} className="min-h-12 w-full justify-start" onClick={() => navigate(item.to)}>
                <Plus className="size-4" />
                {item.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1.45fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="size-5 text-primary" />
              Atividades recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-5">
            {["Lancamentos aguardando integracao", "Contas a pagar sem vencimentos cadastrados", "Relatorios pendentes de revisao"].map((item) => (
              <div key={item} className="grid gap-2 border-b border-border/60 py-3 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center">
                <span className="text-sm text-foreground">{item}</span>
                <Badge variant="secondary">Pendente</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Estatisticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            <StatisticBar icon={ArrowUpCircle} label="Receitas" value={receitaPercent} tone="green" />
            <StatisticBar icon={ArrowDownCircle} label="Despesas" value={despesaPercent} tone="orange" />
            <StatisticBar icon={TrendingUp} label="Saldo" value={saldoPercent} tone="blue" />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function StatisticBar({ icon: Icon, label, value, tone }: { icon: typeof ArrowUpCircle; label: string; value: number; tone: "green" | "orange" | "blue" }) {
  const colors = {
    green: { icon: "bg-success/15 text-success", bar: "bg-success" },
    orange: { icon: "bg-[#ff944d]/15 text-[#ff944d]", bar: "bg-[#ff944d]" },
    blue: { icon: "bg-info/15 text-info", bar: "bg-info" },
  };

  return (
    <div className="grid grid-cols-[2.75rem_1fr_3rem] items-center gap-4">
      <div className={`flex size-11 items-center justify-center rounded-md ${colors[tone].icon}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${colors[tone].bar} ${percentWidthClass(value)}`} />
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
