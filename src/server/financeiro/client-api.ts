const BASE_URL = '/api/financeiro';

async function getAuthHeaders(contentType = false): Promise<HeadersInit | undefined> {
  const [{ supabase }] = await Promise.all([import('@/lib/supabase/client')]);
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {};
  if (contentType) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return Object.keys(headers).length ? headers : undefined;
}

function apiFetch(url: string, init?: RequestInit) {
  if (!init?.headers) {
    if (!init) return fetch(url);
    const rest = { ...init };
    delete rest.headers;
    return Object.keys(rest).length ? fetch(url, rest) : fetch(url);
  }
  return fetch(url, init);
}

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
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/entries?${toSearchParams(filters)}`, { headers })).then(handleResponse),
    findById: (id: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/entries/${id}`, { headers })).then(handleResponse),
    create: (data: unknown) =>
      getAuthHeaders(true).then((headers) => apiFetch(`${BASE_URL}/entries`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })).then(handleResponse),
    update: (id: string, data: unknown) =>
      getAuthHeaders(true).then((headers) => apiFetch(`${BASE_URL}/entries/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      })).then(handleResponse),
    softDelete: (id: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/entries/${id}`, { method: 'DELETE', headers })).then(handleResponse),
  },

  accountsPayable: {
    findAll: (filters?: Record<string, unknown>) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/accounts-payable?${toSearchParams(filters)}`, { headers })).then(handleResponse),
    findById: (id: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/accounts-payable/${id}`, { headers })).then(handleResponse),
    create: (data: unknown) =>
      getAuthHeaders(true).then((headers) => apiFetch(`${BASE_URL}/accounts-payable`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })).then(handleResponse),
    update: (id: string, data: unknown) =>
      getAuthHeaders(true).then((headers) => apiFetch(`${BASE_URL}/accounts-payable/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      })).then(handleResponse),
    softDelete: (id: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/accounts-payable/${id}`, { method: 'DELETE', headers })).then(handleResponse),
  },

  accountsReceivable: {
    findAll: (filters?: Record<string, unknown>) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/accounts-receivable?${toSearchParams(filters)}`, { headers })).then(handleResponse),
    findById: (id: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/accounts-receivable/${id}`, { headers })).then(handleResponse),
    create: (data: unknown) =>
      getAuthHeaders(true).then((headers) => apiFetch(`${BASE_URL}/accounts-receivable`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })).then(handleResponse),
    update: (id: string, data: unknown) =>
      getAuthHeaders(true).then((headers) => apiFetch(`${BASE_URL}/accounts-receivable/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      })).then(handleResponse),
    softDelete: (id: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/accounts-receivable/${id}`, { method: 'DELETE', headers })).then(handleResponse),
  },

  categories: {
    findAll: (filters?: Record<string, unknown>) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/categories?${toSearchParams(filters)}`, { headers })).then(handleResponse),
    findById: (id: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/categories/${id}`, { headers })).then(handleResponse),
    create: (data: unknown) =>
      getAuthHeaders(true).then((headers) => apiFetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })).then(handleResponse),
    update: (id: string, data: unknown) =>
      getAuthHeaders(true).then((headers) => apiFetch(`${BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      })).then(handleResponse),
    softDelete: (id: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/categories/${id}`, { method: 'DELETE', headers })).then(handleResponse),
  },

  costCenters: {
    findAll: (filters?: Record<string, unknown>) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/cost-centers?${toSearchParams(filters)}`, { headers })).then(handleResponse),
    findById: (id: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/cost-centers/${id}`, { headers })).then(handleResponse),
    create: (data: unknown) =>
      getAuthHeaders(true).then((headers) => apiFetch(`${BASE_URL}/cost-centers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })).then(handleResponse),
    update: (id: string, data: unknown) =>
      getAuthHeaders(true).then((headers) => apiFetch(`${BASE_URL}/cost-centers/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      })).then(handleResponse),
    softDelete: (id: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/cost-centers/${id}`, { method: 'DELETE', headers })).then(handleResponse),
  },

  collaborators: {
    findAll: (filters?: Record<string, unknown>) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/collaborators?${toSearchParams(filters)}`, { headers })).then(handleResponse),
    findById: (id: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/collaborators/${id}`, { headers })).then(handleResponse),
    create: (data: unknown) =>
      getAuthHeaders(true).then((headers) => apiFetch(`${BASE_URL}/collaborators`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })).then(handleResponse),
    update: (id: string, data: unknown) =>
      getAuthHeaders(true).then((headers) => apiFetch(`${BASE_URL}/collaborators/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      })).then(handleResponse),
    softDelete: (id: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/collaborators/${id}`, { method: 'DELETE', headers })).then(handleResponse),
  },

  dre: {
    getByYear: (year: number) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/dre?year=${year}`, { headers })).then(handleResponse),
  },

  cashFlow: {
    get: (granularity: string, dateFrom: string, dateTo: string) =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/cash-flow?granularity=${granularity}&dateFrom=${dateFrom}&dateTo=${dateTo}`, { headers })).then(handleResponse),
  },

  dashboard: {
    getKpis: () =>
      getAuthHeaders().then((headers) => apiFetch(`${BASE_URL}/dashboard`, { headers })).then(handleResponse),
  },
};
