export function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

export function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function requireId(id: string | undefined): asserts id is string {
  if (!id) throw Object.assign(new Error("ID é obrigatório"), { name: "ValidationError" });
}

export function handleRepoError(err: unknown): Response {
  const error = err instanceof Error ? err : new Error("Erro desconhecido");
  console.error("[api/financeiro]", error);
  const status = typeof (error as Error & { status?: unknown }).status === "number"
    ? (error as Error & { status: number }).status
    : undefined;
  if (status) return json({ error: error.message }, { status });
  if (error.name === "NotFoundError")
    return json({ error: error.message }, { status: 404 });
  if (error.name === "ZodError" || error.name === "ValidationError")
    return json({ error: error.message }, { status: 400 });
  return json({ error: error.message }, { status: 500 });
}

export async function measureStep<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    if (duration > 100 || process.env.PERF_LOG === "1") {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }
  }
}

export interface RouteArgs {
  request: Request;
  params: Record<string, string | undefined>;
}
