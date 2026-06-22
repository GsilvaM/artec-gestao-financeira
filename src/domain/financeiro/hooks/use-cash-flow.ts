import { useQuery } from '@tanstack/react-query';
import { cashFlowKeys } from '../query-keys';
import { clientApi } from '@/server/financeiro/client-api';

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
