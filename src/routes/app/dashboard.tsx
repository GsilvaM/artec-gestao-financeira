import { Activity, ArrowDownCircle, ArrowUpCircle, Banknote, CalendarCheck, LayoutDashboard, Plus, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard, PageShell } from "@/components/layout/page-shell";
import { calculateFinancialSummary } from "@/domain/financeiro/calculations";
import { useFinancialEntries } from "@/domain/financeiro/hooks/use-financial-entries";
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
  const { data: entries } = useFinancialEntries();
  const { receitas, despesas, saldo } = calculateFinancialSummary(entries ?? []);
  const shortcuts = [
    { label: "Novo lançamento", to: "/app/financeiro/lancamentos" },
    { label: "Nova conta a pagar", to: "/app/financeiro/contas-pagar" },
    { label: "Novo serviço", to: "/app/operacional/servicos" },
    { label: "Emitir relatório", to: "/app/relatorios" },
  ];
  return (
    <PageShell icon={LayoutDashboard} title="Dashboard" subtitle="Visão geral financeira e operacional da Artec">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Receitas" value={formatMoney(receitas)} icon={ArrowUpCircle} tone="green" helper="Lançamentos cadastrados" />
        <MetricCard title="Despesas" value={formatMoney(despesas)} icon={ArrowDownCircle} tone="red" helper="Custos e despesas" />
        <MetricCard title="Saldo projetado" value={formatMoney(saldo)} icon={Banknote} tone={saldo < 0 ? "red" : "blue"} helper="Resultado parcial" />
        <MetricCard title="Serviços ativos" value="18" icon={CalendarCheck} tone="amber" helper="Ordens em andamento" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-5 text-[#174E8C]" />
              Resumo financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="mes" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Area type="monotone" dataKey="receitas" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                <Area type="monotone" dataKey="despesas" stroke="#EF4444" fill="#EF4444" fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="size-5 text-[#174E8C]" />
              Atalhos rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shortcuts.map((item) => (
              <Button key={item.label} variant="outline" className="w-full justify-start" onClick={() => navigate(item.to)}>
                <Plus className="size-4" />
                {item.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atividades recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {['Lançamentos aguardando integração', 'Contas a pagar sem vencimentos cadastrados', 'Serviços pendentes de atualização'].map((item) => (
            <div key={item} className="flex flex-col gap-2 rounded-2xl border border-[#E2E8F0] p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-[#0F172A]">{item}</span>
              <Badge variant="secondary">Pendente</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
