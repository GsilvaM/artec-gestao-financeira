import { getDre } from "../../../server/financeiro/queries.js";
import { json, handleRepoError, type RouteArgs } from "./_utils.js";

export async function loader({ request }: RouteArgs) {
  const url = new URL(request.url);
  const year = url.searchParams.get("year")
    ? Number.parseInt(url.searchParams.get("year")!, 10)
    : new Date().getFullYear();
  try {
    return json(await getDre(year));
  } catch (err) { return handleRepoError(err); }
}
