import {
  accountPayableRepo,
  type CreateAccountPayableData,
} from "../../../server/financeiro/repositories.js";
import {
  accountPayableCreateSchema,
  accountPayableUpdateSchema,
} from "../../../domain/financeiro/schemas.js";
import { z } from "zod";
import { json, parseDate, requireId, handleRepoError, type RouteArgs } from "./_utils.js";

const uuidField = z.string().uuid();

const createSchema = accountPayableCreateSchema.extend({
  userId: uuidField,
});

export async function loader({ request }: RouteArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  try {
    if (id) return json(await accountPayableRepo.findById(id));
    return json(await accountPayableRepo.findAll({
      status: url.searchParams.get("status") ?? undefined,
      categoryId: url.searchParams.get("categoryId") ?? undefined,
      costCenterId: url.searchParams.get("costCenterId") ?? undefined,
      supplier: url.searchParams.get("supplier") ?? undefined,
      dueDateFrom: parseDate(url.searchParams.get("dueDateFrom")),
      dueDateTo: parseDate(url.searchParams.get("dueDateTo")),
      search: url.searchParams.get("search") ?? undefined,
    }));
  } catch (err) { return handleRepoError(err); }
}

export async function action({ request, params }: RouteArgs) {
  const id = params.id;
  try {
    if (request.method === "POST") {
      const body = await request.json();
      const data = createSchema.parse(body) as CreateAccountPayableData;

      return json(await accountPayableRepo.create(data), { status: 201 });
    }
    if (request.method === "PUT") {
      requireId(id);
      const body = await request.json();

      return json(await accountPayableRepo.update(id!, accountPayableUpdateSchema.parse(body)));
    }
    if (request.method === "DELETE") {
      requireId(id);

      return json(await accountPayableRepo.softDelete(id!));
    }
    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) { return handleRepoError(err); }
}
