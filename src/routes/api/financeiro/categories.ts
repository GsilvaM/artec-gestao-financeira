import { categoryRepo, type CreateCategoryData } from "../../../server/financeiro/repositories.js";
import { categoryCreateSchema, categoryUpdateSchema } from "../../../domain/financeiro/schemas.js";
import { json, requireId, handleRepoError, type RouteArgs } from "./_utils.js";

export async function loader({ request }: RouteArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  try {
    if (id) return json(await categoryRepo.findById(id));
    return json(await categoryRepo.findAll({
      type: url.searchParams.get("type") ?? undefined,
    }));
  } catch (err) { return handleRepoError(err); }
}

export async function action({ request, params }: RouteArgs) {
  const id = params.id;
  try {
    if (request.method === "POST") {
      const body = await request.json();
      const data = categoryCreateSchema.parse(body) as CreateCategoryData;

      return json(await categoryRepo.create(data), { status: 201 });
    }
    if (request.method === "PUT") {
      requireId(id);
      const body = await request.json();
      return json(await categoryRepo.update(id!, categoryUpdateSchema.parse(body)));
    }
    if (request.method === "DELETE") {
      requireId(id);
      return json(await categoryRepo.softDelete(id!));
    }
    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) { return handleRepoError(err); }
}
