import type {
  FinancialEntryFilters,
  AccountPayableFilters,
  AccountReceivableFilters,
  CategoryFilters,
  CostCenterFilters,
  CustomerFilters,
  CollaboratorFilters,
} from './types.js';

export const financialEntryKeys = {
  all: ['financial-entries'] as const,
  byId: (id: string) => [...financialEntryKeys.all, id] as const,
  list: (filters?: FinancialEntryFilters, pagination?: { page: number; pageSize: number }) =>
    [...financialEntryKeys.all, 'list', ...(filters ? [filters] : []), ...(pagination ? [pagination] : [])] as const,
};

export const accountPayableKeys = {
  all: ['accounts-payable'] as const,
  byId: (id: string) => [...accountPayableKeys.all, id] as const,
  list: (filters?: AccountPayableFilters) =>
    [...accountPayableKeys.all, 'list', ...(filters ? [filters] : [])] as const,
};

export const accountReceivableKeys = {
  all: ['accounts-receivable'] as const,
  byId: (id: string) => [...accountReceivableKeys.all, id] as const,
  list: (filters?: AccountReceivableFilters) =>
    [...accountReceivableKeys.all, 'list', ...(filters ? [filters] : [])] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  byId: (id: string) => [...categoryKeys.all, id] as const,
  list: (filters?: CategoryFilters) =>
    [...categoryKeys.all, 'list', ...(filters ? [filters] : [])] as const,
};

export const costCenterKeys = {
  all: ['cost-centers'] as const,
  byId: (id: string) => [...costCenterKeys.all, id] as const,
  list: (filters?: CostCenterFilters) =>
    [...costCenterKeys.all, 'list', ...(filters ? [filters] : [])] as const,
};

export const customerKeys = {
  all: ['customers'] as const,
  byId: (id: string) => [...customerKeys.all, id] as const,
  list: (filters?: CustomerFilters) =>
    [...customerKeys.all, 'list', ...(filters ? [filters] : [])] as const,
};

export const collaboratorKeys = {
  all: ['collaborators'] as const,
  byId: (id: string) => [...collaboratorKeys.all, id] as const,
  list: (filters?: CollaboratorFilters) =>
    [...collaboratorKeys.all, 'list', ...(filters ? [filters] : [])] as const,
};

export const beneficiaryKeys = {
  all: ['beneficiaries'] as const,
  search: (params: { type: string; q: string; page: number; pageSize: number }) =>
    [...beneficiaryKeys.all, 'search', params] as const,
};

export const dreKeys = {
  all: ['dre'] as const,
  byPeriod: (dateFrom: string, dateTo: string) =>
    [...dreKeys.all, dateFrom, dateTo] as const,
};

export const cashFlowKeys = {
  all: ['cash-flow'] as const,
  byPeriod: (dateFrom: string, dateTo: string) =>
    [...cashFlowKeys.all, dateFrom, dateTo] as const,
};
