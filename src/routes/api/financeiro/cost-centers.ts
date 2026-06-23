import { costCenterRepo } from "../../../server/financeiro/repositories.js";
import { costCenterCreateSchema, costCenterUpdateSchema } from "../../../domain/financeiro/schemas.js";
import { json, requireId, handleRepoError, type RouteArgs } from "./_utils.js";

export async function loader({ request }: RouteArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  try {
    if (id) return json(await costCenterRepo.findById(id));
    return json(await costCenterRepo.findAll(url.searchParams.get("includeInactive") === "true"));
  } catch (err) { return handleRepoError(err); }
}

export async function action({ request, params }: RouteArgs) {
  const id = params.id;
  try {
    if (request.method === "POST") {
      const body = await request.json();
      return json(await costCenterRepo.create(costCenterCreateSchema.parse(body)), { status: 201 });
    }
    if (request.method === "PUT") {
      requireId(id);
      const body = await request.json();
      return json(await costCenterRepo.update(id!, costCenterUpdateSchema.parse(body)));
    }
    if (request.method === "DELETE") {
      requireId(id);
      return json(await costCenterRepo.softDelete(id!));
    }
    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) { return handleRepoError(err); }
}
