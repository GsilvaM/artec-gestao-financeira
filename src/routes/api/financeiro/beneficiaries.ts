import { z } from "zod";
import { searchBeneficiaries } from "../../../server/financeiro/beneficiaries-service.js";
import type { BeneficiarySearchInput } from "../../../server/financeiro/beneficiaries-service.js";
import { handleRepoError, json, type RouteArgs } from "./_utils.js";

const searchSchema = z.object({
  type: z.enum(["supplier", "collaborator"]),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().default(20),
});

export async function loader({ request }: RouteArgs) {
  const url = new URL(request.url);

  try {
    const parsed = searchSchema.parse({
      type: url.searchParams.get("type") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize:
        url.searchParams.get("pageSize") ??
        url.searchParams.get("page_size") ??
        undefined,
    });

    return json(await searchBeneficiaries(parsed as BeneficiarySearchInput));
  } catch (err) {
    return handleRepoError(err);
  }
}
