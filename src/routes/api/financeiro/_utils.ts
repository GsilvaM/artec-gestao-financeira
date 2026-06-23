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
  if (error.name === "NotFoundError")
    return json({ error: error.message }, { status: 404 });
  if (error.name === "ZodError" || error.name === "ValidationError")
    return json({ error: error.message }, { status: 400 });
  return json({ error: error.message }, { status: 500 });
}

export interface RouteArgs {
  request: Request;
  params: Record<string, string | undefined>;
}
