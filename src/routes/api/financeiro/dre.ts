import { getDre } from "../../../server/financeiro/queries.js";
import { getDreExportFilename, getDreExportPayload, parseDreExportQuery } from "../../../server/financeiro/dre-export.js";
import { renderDrePdf } from "../../../server/financeiro/dre-pdf.js";
import { json, handleRepoError, type RouteArgs } from "./_utils.js";

export async function loader({ request }: RouteArgs) {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/api/financeiro/dre/export/pdf")) {
    return exportPdf(url);
  }

  const year = url.searchParams.get("year")
    ? Number.parseInt(url.searchParams.get("year")!, 10)
    : new Date().getFullYear();
  try {
    return json(await getDre(year));
  } catch (err) { return handleRepoError(err); }
}

async function exportPdf(url: URL) {
  try {
    const query = parseDreExportQuery(url.searchParams);
    const payload = await getDreExportPayload(query);
    const pdf = await renderDrePdf(payload);
    const filename = getDreExportFilename(payload);

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
