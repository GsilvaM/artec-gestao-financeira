const BASE_URL = "/api/financeiro";

async function getAuthHeaders(
  contentType = false
): Promise<HeadersInit | undefined> {
  const [{ supabase }] = await Promise.all([import("@/lib/supabase/client")]);
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {};
  if (contentType) headers["Content-Type"] = "application/json";
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

async function handleBlobResponse(r: Response): Promise<Blob> {
  if (!r.ok) {
    const body = await r.json().catch(() => null);
    throw new Error(body?.error || body?.message || `HTTP ${r.status}`);
  }
  const blob = await r.blob();
  const contentType = r.headers.get("Content-Type") ?? blob.type;
  const header = await blob
    .slice(0, 5)
    .text()
    .catch(() => "");

  if (!contentType.includes("application/pdf") || header !== "%PDF-") {
    const message = await blob.text().catch(() => "");
    throw new Error(
      message || "A exportacao nao retornou um PDF valido. Tente novamente."
    );
  }

  if (blob.size < 128) {
    throw new Error(
      "O PDF gerado esta vazio. Tente novamente ou altere o periodo."
    );
  }

  return blob;
}

async function handleDownloadResponse(r: Response): Promise<Blob> {
  if (!r.ok) {
    const body = await r.json().catch(() => null);
    throw new Error(body?.error || body?.message || `HTTP ${r.status}`);
  }
  const blob = await r.blob();
  if (blob.size < 64) {
    throw new Error("O arquivo gerado esta vazio. Tente novamente ou altere o periodo.");
  }
  return blob;
}

export const clientApi = {
  financialEntries: {
    findAll: (filters?: Record<string, unknown>) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/entries?${toSearchParams(filters)}`, {
            headers,
          })
        )
        .then(handleResponse),
    findById: (id: string) =>
      getAuthHeaders()
        .then((headers) => apiFetch(`${BASE_URL}/entries/${id}`, { headers }))
        .then(handleResponse),
    create: (data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/entries`, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
          })
        )
        .then(handleResponse),
    update: (id: string, data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/entries/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
          })
        )
        .then(handleResponse),
    softDelete: (id: string) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/entries/${id}`, { method: "DELETE", headers })
        )
        .then(handleResponse),
  },

  accountsPayable: {
    findAll: (filters?: Record<string, unknown>) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-payable?${toSearchParams(filters)}`, {
            headers,
          })
        )
        .then(handleResponse),
    findById: (id: string) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-payable/${id}`, { headers })
        )
        .then(handleResponse),
    create: (data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-payable`, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
          })
        )
        .then(handleResponse),
    update: (id: string, data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-payable/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
          })
        )
        .then(handleResponse),
    pay: (id: string, data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-payable/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              ...(data as Record<string, unknown>),
              status: "paid",
            }),
          })
        )
        .then(handleResponse),
    reversePayment: (id: string, data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-payable/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              ...(data as Record<string, unknown>),
              status: "reversed",
            }),
          })
        )
        .then(handleResponse),
    softDelete: (id: string) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-payable/${id}`, {
            method: "DELETE",
            headers,
          })
        )
        .then(handleResponse),
  },

  accountsReceivable: {
    findAll: (filters?: Record<string, unknown>) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(
            `${BASE_URL}/accounts-receivable?${toSearchParams(filters)}`,
            { headers }
          )
        )
        .then(handleResponse),
    findById: (id: string) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-receivable/${id}`, { headers })
        )
        .then(handleResponse),
    create: (data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-receivable`, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
          })
        )
        .then(handleResponse),
    update: (id: string, data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-receivable/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
          })
        )
        .then(handleResponse),
    receive: (id: string, data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-receivable/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              ...(data as Record<string, unknown>),
              status: "received",
            }),
          })
        )
        .then(handleResponse),
    reverseReceipt: (id: string, data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-receivable/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              ...(data as Record<string, unknown>),
              status: "reversed",
            }),
          })
        )
        .then(handleResponse),
    softDelete: (id: string) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/accounts-receivable/${id}`, {
            method: "DELETE",
            headers,
          })
        )
        .then(handleResponse),
  },

  categories: {
    findAll: (filters?: Record<string, unknown>) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/categories?${toSearchParams(filters)}`, {
            headers,
          })
        )
        .then(handleResponse),
    findById: (id: string) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/categories/${id}`, { headers })
        )
        .then(handleResponse),
    create: (data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/categories`, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
          })
        )
        .then(handleResponse),
    update: (id: string, data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/categories/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
          })
        )
        .then(handleResponse),
    softDelete: (id: string) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/categories/${id}`, {
            method: "DELETE",
            headers,
          })
        )
        .then(handleResponse),
  },

  costCenters: {
    findAll: (filters?: Record<string, unknown>) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/cost-centers?${toSearchParams(filters)}`, {
            headers,
          })
        )
        .then(handleResponse),
    findById: (id: string) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/cost-centers/${id}`, { headers })
        )
        .then(handleResponse),
    create: (data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/cost-centers`, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
          })
        )
        .then(handleResponse),
    update: (id: string, data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/cost-centers/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
          })
        )
        .then(handleResponse),
    softDelete: (id: string) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/cost-centers/${id}`, {
            method: "DELETE",
            headers,
          })
        )
        .then(handleResponse),
  },

  collaborators: {
    findAll: (filters?: Record<string, unknown>) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/collaborators?${toSearchParams(filters)}`, {
            headers,
          })
        )
        .then(handleResponse),
    findById: (id: string) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/collaborators/${id}`, { headers })
        )
        .then(handleResponse),
    create: (data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/collaborators`, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
          })
        )
        .then(handleResponse),
    update: (id: string, data: unknown) =>
      getAuthHeaders(true)
        .then((headers) =>
          apiFetch(`${BASE_URL}/collaborators/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
          })
        )
        .then(handleResponse),
    softDelete: (id: string) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/collaborators/${id}`, {
            method: "DELETE",
            headers,
          })
        )
        .then(handleResponse),
  },

  beneficiaries: {
    search: (params: Record<string, unknown>) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/beneficiaries?${toSearchParams(params)}`, {
            headers,
          })
        )
        .then(handleResponse),
  },

  dre: {
    getByYear: (year: number) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/dre?year=${year}`, { headers })
        )
        .then(handleResponse),
    exportPdf: (params: Record<string, string | number>) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/dre/export/pdf?${toSearchParams(params)}`, {
            headers,
          })
        )
        .then(handleBlobResponse),
  },

  cashFlow: {
    get: (granularity: string, dateFrom: string, dateTo: string) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(
            `${BASE_URL}/cash-flow?granularity=${granularity}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
            { headers }
          )
        )
        .then(handleResponse),
    getProjected: (params: Record<string, unknown>) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/cash-flow?${toSearchParams({ ...params, mode: "projected" })}`, {
            headers,
          })
        )
        .then(handleResponse),
    exportPdf: (params: Record<string, unknown>) =>
      getAuthHeaders()
        .then((headers) =>
          apiFetch(`${BASE_URL}/cash-flow/export/pdf?${toSearchParams(params)}`, {
            headers,
          })
        )
        .then(handleDownloadResponse),
  },

  dashboard: {
    getKpis: () =>
      getAuthHeaders()
        .then((headers) => apiFetch(`${BASE_URL}/dashboard`, { headers }))
        .then(handleResponse),
  },
};
