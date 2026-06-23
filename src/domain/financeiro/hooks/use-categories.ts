import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryKeys } from '../query-keys.js';
import { clientApi } from '@/server/financeiro/client-api';
import type { CategoryRow, CategoryFilters, CategoryUpdate } from '../types.js';

type CategoryApiResponse = {
  id: string;
  name: string;
  type: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

function toRow(c: CategoryApiResponse): CategoryRow {
  return {
    id: c.id,
    name: c.name,
    type: c.type as CategoryRow['type'],
    color: c.color,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export function useCategories(filters?: CategoryFilters) {
  return useQuery({
    queryKey: categoryKeys.list(filters),
    queryFn: async () => {
      const categories: CategoryApiResponse[] = await clientApi.categories.findAll(filters as Record<string, unknown>);
      return categories.map(toRow);
    },
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.byId(id),
    queryFn: async () => {
      const category: CategoryApiResponse = await clientApi.categories.findById(id);
      return toRow(category);
    },
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => clientApi.categories.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
      clientApi.categories.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.categories.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
