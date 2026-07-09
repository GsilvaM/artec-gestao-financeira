import { useQuery } from '@tanstack/react-query';
import { cashFlowKeys } from '../query-keys.js';
import { clientApi } from '@/server/financeiro/client-api';
import type { ProjectedCashFlowResult, CashFlowGranularity, CashFlowView } from '../cash-flow.js';

type Granularity = 'day' | 'week' | 'month';

export function useCashFlow(granularity: Granularity, dateFrom: Date, dateTo: Date) {
  const from = dateFrom.toISOString().slice(0, 10);
  const to = dateTo.toISOString().slice(0, 10);

  return useQuery({
    queryKey: [...cashFlowKeys.byPeriod(from, to), granularity] as const,
    queryFn: () => clientApi.cashFlow.get(granularity, from, to),
    enabled: !!dateFrom && !!dateTo,
  });
}

export interface ProjectedCashFlowParams {
  granularity: CashFlowGranularity;
  view: CashFlowView;
  dateFrom: string;
  dateTo: string;
  categoryId?: string;
  bank?: string;
}

export function useProjectedCashFlow(params: ProjectedCashFlowParams) {
  return useQuery({
    queryKey: [...cashFlowKeys.all, 'projected', params] as const,
    queryFn: () => clientApi.cashFlow.getProjected({ ...params }) as Promise<ProjectedCashFlowResult>,
    enabled: Boolean(params.dateFrom && params.dateTo),
  });
}
