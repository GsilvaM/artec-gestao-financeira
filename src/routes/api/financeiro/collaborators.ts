import { collaboratorRepo, type CreateCollaboratorData } from "../../../server/financeiro/repositories.js";
import { collaboratorCreateSchema, collaboratorUpdateSchema } from "../../../domain/financeiro/schemas.js";
import { json, requireId, handleRepoError, type RouteArgs } from "./_utils.js";

export async function loader({ request, params }: RouteArgs) {
  const url = new URL(request.url);
  const id = params.id ?? url.searchParams.get("id");
  try {
    if (id) return json(await collaboratorRepo.findById(id));
    return json(await collaboratorRepo.findAll({
      includeInactive: url.searchParams.get("includeInactive") === "true",
      search: url.searchParams.get("search") ?? undefined,
    }));
  } catch (err) {
    return handleRepoError(err);
  }
}

export async function action({ request, params }: RouteArgs) {
  const id = params.id;
  try {
    if (request.method === "POST") {
      const body = await request.json();
      const data = collaboratorCreateSchema.parse(body) as CreateCollaboratorData;

      return json(await collaboratorRepo.create(data), { status: 201 });
    }
    if (request.method === "PUT") {
      requireId(id);
      const body = await request.json();
      return json(await collaboratorRepo.update(id!, collaboratorUpdateSchema.parse(body)));
    }
    if (request.method === "DELETE") {
      requireId(id);
      return json(await collaboratorRepo.softDelete(id!));
    }
    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) {
    return handleRepoError(err);
  }
}
