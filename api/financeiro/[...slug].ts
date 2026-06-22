import {
  financialEntryRepo,
  accountPayableRepo,
  accountReceivableRepo,
  categoryRepo,
  costCenterRepo,
} from "../../src/server/financeiro/repositories.js";
import { getDre, getCashFlow } from "../../src/server/financeiro/queries.js";

function parseBody(req: import("http").IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk: string) => (raw += chunk));
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function send(res: import("http").ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export default async function handler(
  req: import("http").IncomingMessage,
  res: import("http").ServerResponse
) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const segments = url.pathname.replace(/^\/api\/financeiro\//, "").split("/").filter(Boolean);
  const resource = segments[0];
  const id = segments[1];
  const method = req.method ?? "GET";

  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { params[k] = v; });

  try {
    let result: unknown;

    switch (resource) {
      // --- Financial Entries ---
      case "entries": {
        if (method === "GET") {
          result = id
            ? await financialEntryRepo.findById(id)
            : await financialEntryRepo.findAll({
                ...(params.type ? { type: params.type } : {}),
                ...(params.status ? { status: params.status } : {}),
                ...(params.categoryId ? { categoryId: params.categoryId } : {}),
                ...(params.costCenterId ? { costCenterId: params.costCenterId } : {}),
                ...(params.dateFrom ? { dateFrom: new Date(params.dateFrom) } : {}),
                ...(params.dateTo ? { dateTo: new Date(params.dateTo) } : {}),
              });
        } else if (method === "POST") {
          const data = (await parseBody(req)) as Record<string, unknown>;
          result = await financialEntryRepo.create(data as any);
        } else if (method === "PUT" && id) {
          const data = (await parseBody(req)) as Record<string, unknown>;
          result = await financialEntryRepo.update(id, data as any);
        } else if (method === "DELETE" && id) {
          result = await financialEntryRepo.softDelete(id);
        } else {
          return send(res, 405, { error: "Method not allowed" });
        }
        break;
      }

      // --- Accounts Payable ---
      case "accounts-payable": {
        if (method === "GET") {
          result = id
            ? await accountPayableRepo.findById(id)
            : await accountPayableRepo.findAll({
                ...(params.status ? { status: params.status } : {}),
                ...(params.categoryId ? { categoryId: params.categoryId } : {}),
                ...(params.costCenterId ? { costCenterId: params.costCenterId } : {}),
                ...(params.supplier ? { supplier: params.supplier } : {}),
                ...(params.dueDateFrom ? { dueDateFrom: new Date(params.dueDateFrom) } : {}),
                ...(params.dueDateTo ? { dueDateTo: new Date(params.dueDateTo) } : {}),
              });
        } else if (method === "POST") {
          const data = (await parseBody(req)) as Record<string, unknown>;
          result = await accountPayableRepo.create(data as any);
        } else if (method === "PUT" && id) {
          const data = (await parseBody(req)) as Record<string, unknown>;
          result = await accountPayableRepo.update(id, data as any);
        } else if (method === "DELETE" && id) {
          result = await accountPayableRepo.softDelete(id);
        } else {
          return send(res, 405, { error: "Method not allowed" });
        }
        break;
      }

      // --- Accounts Receivable ---
      case "accounts-receivable": {
        if (method === "GET") {
          result = id
            ? await accountReceivableRepo.findById(id)
            : await accountReceivableRepo.findAll({
                ...(params.status ? { status: params.status } : {}),
                ...(params.categoryId ? { categoryId: params.categoryId } : {}),
                ...(params.costCenterId ? { costCenterId: params.costCenterId } : {}),
                ...(params.client ? { client: params.client } : {}),
                ...(params.dueDateFrom ? { dueDateFrom: new Date(params.dueDateFrom) } : {}),
                ...(params.dueDateTo ? { dueDateTo: new Date(params.dueDateTo) } : {}),
              });
        } else if (method === "POST") {
          const data = (await parseBody(req)) as Record<string, unknown>;
          result = await accountReceivableRepo.create(data as any);
        } else if (method === "PUT" && id) {
          const data = (await parseBody(req)) as Record<string, unknown>;
          result = await accountReceivableRepo.update(id, data as any);
        } else if (method === "DELETE" && id) {
          result = await accountReceivableRepo.softDelete(id);
        } else {
          return send(res, 405, { error: "Method not allowed" });
        }
        break;
      }

      // --- Categories ---
      case "categories": {
        if (method === "GET") {
          result = id
            ? await categoryRepo.findById(id)
            : await categoryRepo.findAll({
                ...(params.type ? { type: params.type } : {}),
              });
        } else if (method === "POST") {
          const data = (await parseBody(req)) as Record<string, unknown>;
          result = await categoryRepo.create(data as any);
        } else if (method === "PUT" && id) {
          const data = (await parseBody(req)) as Record<string, unknown>;
          result = await categoryRepo.update(id, data as any);
        } else if (method === "DELETE" && id) {
          result = await categoryRepo.softDelete(id);
        } else {
          return send(res, 405, { error: "Method not allowed" });
        }
        break;
      }

      // --- Cost Centers ---
      case "cost-centers": {
        if (method === "GET") {
          result = id
            ? await costCenterRepo.findById(id)
            : await costCenterRepo.findAll(params.includeInactive === "true");
        } else if (method === "POST") {
          const data = (await parseBody(req)) as Record<string, unknown>;
          result = await costCenterRepo.create(data as any);
        } else if (method === "PUT" && id) {
          const data = (await parseBody(req)) as Record<string, unknown>;
          result = await costCenterRepo.update(id, data as any);
        } else if (method === "DELETE" && id) {
          result = await costCenterRepo.softDelete(id);
        } else {
          return send(res, 405, { error: "Method not allowed" });
        }
        break;
      }

      // --- DRE ---
      case "dre": {
        if (method === "GET") {
          const year = params.year ? Number.parseInt(params.year, 10) : new Date().getFullYear();
          result = await getDre(year);
        } else {
          return send(res, 405, { error: "Method not allowed" });
        }
        break;
      }

      // --- Cash Flow ---
      case "cash-flow": {
        if (method === "GET") {
          if (!params.dateFrom || !params.dateTo) {
            return send(res, 400, { error: "dateFrom and dateTo are required" });
          }
          result = await getCashFlow(
            (params.granularity ?? "month") as "day" | "week" | "month",
            new Date(params.dateFrom),
            new Date(params.dateTo),
          );
        } else {
          return send(res, 405, { error: "Method not allowed" });
        }
        break;
      }

      default:
        return send(res, 404, { error: `Resource '${resource}' not found` });
    }

    send(res, 200, result ?? null);
  } catch (err: unknown) {
    const error = err as Error & { code?: string; name?: string };
    console.error(`[api/financeiro] ${method} ${url.pathname} :`, error);

    if (error.name === "NotFoundError") {
      return send(res, 404, { error: error.message });
    }

    send(res, 500, { error: error.message ?? "Internal server error" });
  }
}
