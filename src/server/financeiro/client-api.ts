const BASE_URL = '/api/financeiro';

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

async function handleResponse(r: Response): Promise<unknown> {
  if (!r.ok) {
    const body = await r.json().catch(() => null);
    throw new Error(body?.error || body?.message || `HTTP ${r.status}`);
  }
  return r.json();
}

export const clientApi = {
  financialEntries: {
    findAll: (filters?: Record<string, unknown>) =>
      fetch(`${BASE_URL}/entries?${toSearchParams(filters)}`).then(handleResponse),
    findById: (id: string) =>
      fetch(`${BASE_URL}/entries/${id}`).then(handleResponse),
    create: (data: unknown) =>
      fetch(`${BASE_URL}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: unknown) =>
      fetch(`${BASE_URL}/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    softDelete: (id: string) =>
      fetch(`${BASE_URL}/entries/${id}`, { method: 'DELETE' }).then(handleResponse),
  },

  accountsPayable: {
    findAll: (filters?: Record<string, unknown>) =>
      fetch(`${BASE_URL}/accounts-payable?${toSearchParams(filters)}`).then(handleResponse),
    findById: (id: string) =>
      fetch(`${BASE_URL}/accounts-payable/${id}`).then(handleResponse),
    create: (data: unknown) =>
      fetch(`${BASE_URL}/accounts-payable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: unknown) =>
      fetch(`${BASE_URL}/accounts-payable/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    softDelete: (id: string) =>
      fetch(`${BASE_URL}/accounts-payable/${id}`, { method: 'DELETE' }).then(handleResponse),
  },

  accountsReceivable: {
    findAll: (filters?: Record<string, unknown>) =>
      fetch(`${BASE_URL}/accounts-receivable?${toSearchParams(filters)}`).then(handleResponse),
    findById: (id: string) =>
      fetch(`${BASE_URL}/accounts-receivable/${id}`).then(handleResponse),
    create: (data: unknown) =>
      fetch(`${BASE_URL}/accounts-receivable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: unknown) =>
      fetch(`${BASE_URL}/accounts-receivable/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    softDelete: (id: string) =>
      fetch(`${BASE_URL}/accounts-receivable/${id}`, { method: 'DELETE' }).then(handleResponse),
  },

  categories: {
    findAll: (filters?: Record<string, unknown>) =>
      fetch(`${BASE_URL}/categories?${toSearchParams(filters)}`).then(handleResponse),
    findById: (id: string) =>
      fetch(`${BASE_URL}/categories/${id}`).then(handleResponse),
    create: (data: unknown) =>
      fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: unknown) =>
      fetch(`${BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    softDelete: (id: string) =>
      fetch(`${BASE_URL}/categories/${id}`, { method: 'DELETE' }).then(handleResponse),
  },

  costCenters: {
    findAll: (filters?: Record<string, unknown>) =>
      fetch(`${BASE_URL}/cost-centers?${toSearchParams(filters)}`).then(handleResponse),
    findById: (id: string) =>
      fetch(`${BASE_URL}/cost-centers/${id}`).then(handleResponse),
    create: (data: unknown) =>
      fetch(`${BASE_URL}/cost-centers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: unknown) =>
      fetch(`${BASE_URL}/cost-centers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    softDelete: (id: string) =>
      fetch(`${BASE_URL}/cost-centers/${id}`, { method: 'DELETE' }).then(handleResponse),
  },

  dre: {
    getByYear: (year: number) =>
      fetch(`${BASE_URL}/dre?year=${year}`).then(handleResponse),
  },

  cashFlow: {
    get: (granularity: string, dateFrom: string, dateTo: string) =>
      fetch(`${BASE_URL}/cash-flow?granularity=${granularity}&dateFrom=${dateFrom}&dateTo=${dateTo}`).then(handleResponse),
  },
};
