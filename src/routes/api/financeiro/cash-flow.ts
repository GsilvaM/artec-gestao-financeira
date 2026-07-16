import { parseCashFlowExportQuery, getCashFlowExportFilename, getCashFlowExportPayload } from "../../../server/financeiro/cash-flow-export.js";
import { renderCashFlowPdf } from "../../../server/financeiro/cash-flow-pdf.js";
import { getCashFlow, getProjectedCashFlow } from "../../../server/financeiro/queries.js";
import { cashFlowQuerySchema } from "../../../domain/financeiro/cash-flow.js";
import { json, handleRepoError, type RouteArgs } from "./_utils.js";

export async function loader({ request }: RouteArgs) {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/api/financeiro/cash-flow/export/pdf") || url.pathname.endsWith("/cash-flow/export/pdf")) {
    return exportPdf(url);
  }

  try {
    const query = cashFlowQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
    if (url.searchParams.get("mode") === "projected") {
      return json(await getProjectedCashFlow({
        granularity: query.granularity,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        view: query.view,
        categoryId: query.categoryId,
        bank: query.bank,
      }));
    }
    return json(await getCashFlow(query.granularity, query.dateFrom, query.dateTo));
  } catch (err) { return handleRepoError(err); }
}

async function exportPdf(url: URL) {
  try {
    const query = parseCashFlowExportQuery(url.searchParams);
    const payload = await getCashFlowExportPayload(query);
    const pdf = await renderCashFlowPdf(payload);
    const filename = getCashFlowExportFilename(payload);

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return handleRepoError(err);
  }
}
