import { getDashboardKpis } from "../../../server/financeiro/queries.js";
import { json, handleRepoError, measureStep, type RouteArgs } from "./_utils.js";

export async function loader(_args: RouteArgs) {
  try {
    return json(await measureStep("financeiro.dashboard.kpis", getDashboardKpis));
  } catch (err) {
    return handleRepoError(err);
  }
}
