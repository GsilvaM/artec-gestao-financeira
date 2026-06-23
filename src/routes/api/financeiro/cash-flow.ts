import { getCashFlow } from "../../../server/financeiro/queries.js";
import { json, parseDate, handleRepoError, type RouteArgs } from "./_utils.js";

export async function loader({ request }: RouteArgs) {
  const url = new URL(request.url);
  const rawFrom = url.searchParams.get("dateFrom");
  const rawTo = url.searchParams.get("dateTo");
  if (!rawFrom || !rawTo)
    return json({ error: "dateFrom and dateTo are required" }, { status: 400 });
  const dateFrom = parseDate(rawFrom);
  const dateTo = parseDate(rawTo);
  if (!dateFrom || !dateTo)
    return json({ error: "Invalid date range" }, { status: 400 });
  const granularity = (url.searchParams.get("granularity") ?? "month") as "day" | "week" | "month";
  try {
    return json(await getCashFlow(granularity, dateFrom, dateTo));
  } catch (err) { return handleRepoError(err); }
}
