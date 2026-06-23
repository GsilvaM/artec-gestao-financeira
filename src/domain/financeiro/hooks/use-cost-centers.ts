import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costCenterKeys } from '../query-keys.js';
import { clientApi } from '@/server/financeiro/client-api';
import type { CostCenterRow, CostCenterFilters, CostCenterUpdate } from '../types.js';

type CostCenterApiResponse = {
  id: string;
  name: string;
  code: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function toRow(cc: CostCenterApiResponse): CostCenterRow {
  return {
    id: cc.id,
    name: cc.name,
    code: cc.code,
    active: cc.active,
    createdAt: cc.createdAt,
    updatedAt: cc.updatedAt,
  };
}

export function useCostCenters(filters?: CostCenterFilters) {
  return useQuery({
    queryKey: costCenterKeys.list(filters),
    queryFn: async () => {
      const centers = await clientApi.costCenters.findAll(filters as Record<string, unknown>) as CostCenterApiResponse[];
      return centers.map(toRow);
    },
  });
}

export function useCostCenter(id: string) {
  return useQuery({
    queryKey: costCenterKeys.byId(id),
    queryFn: async () => {
      const center = await clientApi.costCenters.findById(id) as CostCenterApiResponse;
      return toRow(center);
    },
    enabled: !!id,
  });
}

export function useCreateCostCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => clientApi.costCenters.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: costCenterKeys.all }),
  });
}

export function useUpdateCostCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CostCenterUpdate }) =>
      clientApi.costCenters.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: costCenterKeys.all }),
  });
}

export function useDeleteCostCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.costCenters.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: costCenterKeys.all }),
  });
}
