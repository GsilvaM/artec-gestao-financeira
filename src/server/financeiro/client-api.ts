const BASE_URL = '/.netlify/functions/financeiro';

function toSearchParams(params?: Record<string, unknown>): URLSearchParams {
  const sp = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        sp.set(key, String(value));
      }
    }
  }
  return sp;
}

export const clientApi = {
  financialEntries: {
    findAll: (filters?: Record<string, unknown>) =>
      fetch(`${BASE_URL}/entries?${toSearchParams(filters)}`).then(r => r.json()),
    findById: (id: string) =>
      fetch(`${BASE_URL}/entries/${id}`).then(r => r.json()),
    create: (data: unknown) =>
      fetch(`${BASE_URL}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    update: (id: string, data: unknown) =>
      fetch(`${BASE_URL}/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    softDelete: (id: string) =>
      fetch(`${BASE_URL}/entries/${id}`, { method: 'DELETE' }).then(r => r.json()),
  },

  accountsPayable: {
    findAll: (filters?: Record<string, unknown>) =>
      fetch(`${BASE_URL}/accounts-payable?${toSearchParams(filters)}`).then(r => r.json()),
    findById: (id: string) =>
      fetch(`${BASE_URL}/accounts-payable/${id}`).then(r => r.json()),
    create: (data: unknown) =>
      fetch(`${BASE_URL}/accounts-payable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    update: (id: string, data: unknown) =>
      fetch(`${BASE_URL}/accounts-payable/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    softDelete: (id: string) =>
      fetch(`${BASE_URL}/accounts-payable/${id}`, { method: 'DELETE' }).then(r => r.json()),
  },

  accountsReceivable: {
    findAll: (filters?: Record<string, unknown>) =>
      fetch(`${BASE_URL}/accounts-receivable?${toSearchParams(filters)}`).then(r => r.json()),
    findById: (id: string) =>
      fetch(`${BASE_URL}/accounts-receivable/${id}`).then(r => r.json()),
    create: (data: unknown) =>
      fetch(`${BASE_URL}/accounts-receivable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    update: (id: string, data: unknown) =>
      fetch(`${BASE_URL}/accounts-receivable/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    softDelete: (id: string) =>
      fetch(`${BASE_URL}/accounts-receivable/${id}`, { method: 'DELETE' }).then(r => r.json()),
  },

  categories: {
    findAll: (filters?: Record<string, unknown>) =>
      fetch(`${BASE_URL}/categories?${toSearchParams(filters)}`).then(r => r.json()),
    findById: (id: string) =>
      fetch(`${BASE_URL}/categories/${id}`).then(r => r.json()),
    create: (data: unknown) =>
      fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    update: (id: string, data: unknown) =>
      fetch(`${BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    softDelete: (id: string) =>
      fetch(`${BASE_URL}/categories/${id}`, { method: 'DELETE' }).then(r => r.json()),
  },

  costCenters: {
    findAll: (includeInactive?: boolean) =>
      fetch(`${BASE_URL}/cost-centers?${includeInactive ? 'includeInactive=true' : ''}`).then(r => r.json()),
    findById: (id: string) =>
      fetch(`${BASE_URL}/cost-centers/${id}`).then(r => r.json()),
    create: (data: unknown) =>
      fetch(`${BASE_URL}/cost-centers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    update: (id: string, data: unknown) =>
      fetch(`${BASE_URL}/cost-centers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    softDelete: (id: string) =>
      fetch(`${BASE_URL}/cost-centers/${id}`, { method: 'DELETE' }).then(r => r.json()),
  },

  dre: {
    getByYear: (year: number) =>
      fetch(`${BASE_URL}/dre?year=${year}`).then(r => r.json()),
  },

  cashFlow: {
    get: (granularity: string, dateFrom: string, dateTo: string) =>
      fetch(`${BASE_URL}/cash-flow?granularity=${granularity}&dateFrom=${dateFrom}&dateTo=${dateTo}`).then(r => r.json()),
  },
};
