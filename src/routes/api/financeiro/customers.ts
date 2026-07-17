import { customerRepo, type CreateCustomerData } from "../../../server/financeiro/repositories.js";
import { customerCreateSchema, customerUpdateSchema } from "../../../domain/financeiro/schemas.js";
import { json, requireId, handleRepoError, type RouteArgs } from "./_utils.js";

function requireAuthenticatedUserId(authenticatedUserId: string | undefined) {
  if (!authenticatedUserId && process.env.NODE_ENV !== "test") {
    throw Object.assign(new Error("Usuario autenticado nao identificado."), {
      name: "ValidationError",
      status: 401,
    });
  }
  return authenticatedUserId ?? "00000000-0000-0000-0000-000000000000";
}

export async function loader({ request, params }: RouteArgs) {
  const url = new URL(request.url);
  const id = params.id ?? url.searchParams.get("id");
  try {
    if (id) return json(await customerRepo.findById(id));
    return json(await customerRepo.findAll({
      includeInactive: url.searchParams.get("includeInactive") === "true",
      search: url.searchParams.get("search") ?? undefined,
      document: url.searchParams.get("document") ?? undefined,
      email: url.searchParams.get("email") ?? undefined,
    }));
  } catch (err) {
    return handleRepoError(err);
  }
}

export async function action({ request, params, authenticatedUserId }: RouteArgs) {
  const id = params.id;
  try {
    if (request.method === "POST") {
      const userId = requireAuthenticatedUserId(authenticatedUserId);
      const body = await request.json();
      const data = customerCreateSchema.parse(body) as Omit<CreateCustomerData, "userId">;

      return json(await customerRepo.create({ ...data, userId }), { status: 201 });
    }
    if (request.method === "PUT") {
      requireId(id);
      const body = await request.json();
      return json(await customerRepo.update(id!, customerUpdateSchema.parse(body)));
    }
    if (request.method === "DELETE") {
      requireId(id);
      return json(await customerRepo.softDelete(id!));
    }
    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) {
    return handleRepoError(err);
  }
}
