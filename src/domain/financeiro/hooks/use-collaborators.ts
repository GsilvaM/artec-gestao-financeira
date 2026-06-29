import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collaboratorKeys } from '../query-keys.js';
import { clientApi } from '@/server/financeiro/client-api';
import type { CollaboratorFilters, CollaboratorRow, CollaboratorUpdate } from '../types.js';

type CollaboratorApiResponse = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function toRow(c: CollaboratorApiResponse): CollaboratorRow {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    role: c.role,
    active: c.active,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export function useCollaborators(filters?: CollaboratorFilters) {
  return useQuery({
    queryKey: collaboratorKeys.list(filters),
    queryFn: async () => {
      const collaborators = await clientApi.collaborators.findAll(filters as Record<string, unknown>) as CollaboratorApiResponse[];
      return collaborators.map(toRow);
    },
  });
}

export function useCollaborator(id: string) {
  return useQuery({
    queryKey: collaboratorKeys.byId(id),
    queryFn: async () => {
      const collaborator = await clientApi.collaborators.findById(id) as CollaboratorApiResponse;
      return toRow(collaborator);
    },
    enabled: !!id,
  });
}

export function useCreateCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => clientApi.collaborators.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: collaboratorKeys.all }),
  });
}

export function useUpdateCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CollaboratorUpdate }) =>
      clientApi.collaborators.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: collaboratorKeys.all }),
  });
}

export function useDeleteCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.collaborators.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: collaboratorKeys.all }),
  });
}
