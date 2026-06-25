import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CalendarCheck,
  Clock3,
  LayoutDashboard,
  Plus,
  TrendingUp,
  WalletCards,
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
  const shortcuts = [
    { label: "Novo lancamento", to: "/app/financeiro/lancamentos" },
    { label: "Nova conta a pagar", to: "/app/financeiro/contas-pagar" },
    { label: "Novo servico", to: "/app/operacional/servicos" },
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            title="Faturamento"
            value={formatMoney(kpis?.totalReceitas ?? 0)}
            icon={ArrowUpCircle}
            tone="green"
            helper="Receitas registradas"
            className="xl:col-span-2"
          />
          <MetricCard
            title="Lucro"
            value={formatMoney(saldo)}
            icon={Banknote}
            tone={saldo < 0 ? "red" : "blue"}
            helper="Receitas - despesas"
            className="xl:col-span-2"
          />
          <MetricCard
            title="Despesas"
            value={formatMoney(kpis?.totalDespesas ?? 0)}
            icon={ArrowDownCircle}
            tone="red"
            helper="Custos totais"
            className="xl:col-span-2"
          />
          <MetricCard
            title="Fluxo de caixa"
            value={formatMoney(saldo)}
            icon={WalletCards}
            tone={saldo < 0 ? "red" : "blue"}
            helper="Saldo projetado"
            className="xl:col-span-2"
          />
          <MetricCard
            title="A receber"
            value={String(kpis?.contasRecebidasMes ?? 0)}
            icon={CalendarCheck}
            tone="green"
            helper="Recebidas no mes"
            className="xl:col-span-2"
          />
          <MetricCard
            title="A pagar"
            value={String(contasAPagar)}
            icon={Clock3}
            tone={(kpis?.contasVencidas ?? 0) > 0 ? "amber" : "slate"}
            helper={`${kpis?.contasVencidas ?? 0} vencidas`}
            className="xl:col-span-2"
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-5 text-primary" />
              Resumo financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-5">
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
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="size-5 text-primary" />
              Atalhos rapidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {shortcuts.map((item) => (
              <Button key={item.label} variant="outline" className="w-full justify-start" onClick={() => navigate(item.to)}>
                <Plus className="size-4" />
                {item.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle className="text-lg">Atividades recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {["Lancamentos aguardando integracao", "Contas a pagar sem vencimentos cadastrados", "Servicos pendentes de atualizacao"].map((item) => (
            <div key={item} className="flex flex-col gap-2 rounded-md border border-border/80 bg-muted/25 p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-foreground">{item}</span>
              <Badge variant="secondary">Pendente</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
