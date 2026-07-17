import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerKeys } from "../query-keys.js";
import { clientApi } from "@/server/financeiro/client-api";
import type { CustomerFilters, CustomerRow, CustomerUpdate } from "../types.js";

type CustomerApiResponse = {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

function toRow(customer: CustomerApiResponse): CustomerRow {
  return {
    id: customer.id,
    name: customer.name,
    document: customer.document,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    notes: customer.notes,
    active: customer.active,
    userId: customer.userId,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: async () => {
      const customers = await clientApi.customers.findAll(filters as Record<string, unknown>) as CustomerApiResponse[];
      return customers.map(toRow);
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => clientApi.customers.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdate }) =>
      clientApi.customers.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApi.customers.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
