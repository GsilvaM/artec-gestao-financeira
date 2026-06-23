import { useQuery } from '@tanstack/react-query';
import { dreKeys } from '../query-keys.js';
import { clientApi } from '@/server/financeiro/client-api';

export function useDre(year: number) {
  const dateFrom = `${year}-01-01`;
  const dateTo = `${year}-12-31`;

  return useQuery({
    queryKey: dreKeys.byPeriod(dateFrom, dateTo),
    queryFn: () => clientApi.dre.getByYear(year),
    enabled: Number.isFinite(year),
  });
}
