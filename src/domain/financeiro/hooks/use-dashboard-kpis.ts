import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/server/financeiro/client-api";
import { toFiniteNumber } from "@/lib/utils";

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

function toDashboardKpis(data: unknown): DashboardKpis {
  const raw = data as Partial<Record<keyof DashboardKpis, unknown>>;
  return {
    totalReceitas: toFiniteNumber(raw.totalReceitas),
    totalDespesas: toFiniteNumber(raw.totalDespesas),
    saldo: toFiniteNumber(raw.saldo),
    contasAVencer: toFiniteNumber(raw.contasAVencer),
    contasVencidas: toFiniteNumber(raw.contasVencidas),
    contasAReceber: toFiniteNumber(raw.contasAReceber),
    contasReceberVencidas: toFiniteNumber(raw.contasReceberVencidas),
    contasPagasMes: toFiniteNumber(raw.contasPagasMes),
    contasRecebidasMes: toFiniteNumber(raw.contasRecebidasMes),
  };
}

export function useDashboardKpis() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: async () => toDashboardKpis(await clientApi.dashboard.getKpis()),
    staleTime: 30_000,
  });
}
