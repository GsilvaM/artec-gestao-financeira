import { parseCashFlowExportQuery, getCashFlowExportFilename, getCashFlowExportPayload } from "../../../server/financeiro/cash-flow-export.js";
import { renderCashFlowPdf } from "../../../server/financeiro/cash-flow-pdf.js";
import { getCashFlow, getProjectedCashFlow } from "../../../server/financeiro/queries.js";
import { json, parseDate, handleRepoError, type RouteArgs } from "./_utils.js";

export async function loader({ request }: RouteArgs) {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/api/financeiro/cash-flow/export/pdf") || url.pathname.endsWith("/cash-flow/export/pdf")) {
    return exportPdf(url);
  }

  const rawFrom = url.searchParams.get("dateFrom");
  const rawTo = url.searchParams.get("dateTo");
  if (!rawFrom || !rawTo)
    return json({ error: "dateFrom and dateTo are required" }, { status: 400 });
  const dateFrom = parseDate(rawFrom);
  const dateTo = parseDate(rawTo);
  if (!dateFrom || !dateTo)
    return json({ error: "Invalid date range" }, { status: 400 });
  const granularity = (url.searchParams.get("granularity") ?? "day") as "day" | "week" | "month";
  try {
    if (url.searchParams.get("mode") === "projected") {
      return json(await getProjectedCashFlow({
        granularity,
        dateFrom,
        dateTo,
        view: (url.searchParams.get("view") ?? "both") as "both" | "inflows" | "outflows",
        categoryId: url.searchParams.get("categoryId"),
        bank: url.searchParams.get("bank") ?? "all",
      }));
    }
    return json(await getCashFlow(granularity, dateFrom, dateTo));
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
