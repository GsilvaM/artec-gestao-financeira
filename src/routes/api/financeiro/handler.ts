import * as entries from "./entries.js";
import * as accountsPayable from "./accounts-payable.js";
import * as accountsReceivable from "./accounts-receivable.js";
import * as categories from "./categories.js";
import * as costCenters from "./cost-centers.js";
import * as dre from "./dre.js";
import * as cashFlow from "./cash-flow.js";
import { json } from "./_utils.js";
import { requireApprovedUser } from "../auth-utils.js";

interface RouteModule {
  loader?: (args: { request: Request; params: Record<string, string | undefined> }) => Promise<Response>;
  action?: (args: { request: Request; params: Record<string, string | undefined> }) => Promise<Response>;
}

const routes: Record<string, RouteModule> = {
  entries,
  "accounts-payable": accountsPayable,
  "accounts-receivable": accountsReceivable,
  categories,
  "cost-centers": costCenters,
  dre,
  "cash-flow": cashFlow,
};

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.replace(/^\/api\/financeiro\/?/, "").split("/").filter(Boolean);
  const resource = segments[0];
  const id = segments[1];
  const method = request.method;

  if (!resource || !routes[resource]) {
    return json({ error: `Resource '${resource ?? ""}' not found` }, { status: 404 });
  }

  if (process.env.NODE_ENV !== "test") {
    try {
      await requireApprovedUser(request);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Sessao invalida.");
      const status = typeof (error as Error & { status?: unknown }).status === "number"
        ? (error as Error & { status: number }).status
        : 401;
      return json({ error: error.message }, { status });
    }
  }

  const mod = routes[resource];
  const args = { request, params: { id } };

  if (method === "GET") {
    if (!mod.loader) return json({ error: "Method not allowed" }, { status: 405 });
    return mod.loader(args);
  }

  if (!mod.action) return json({ error: "Method not allowed" }, { status: 405 });
  return mod.action(args);
}
