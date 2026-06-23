import {
  financialEntryRepo,
  type CreateFinancialEntryData,
} from "../../../server/financeiro/repositories.js";
import {
  financialEntryCreateSchema,
  financialEntryUpdateSchema,
} from "../../../domain/financeiro/schemas.js";
import { z } from "zod";
import { json, parseDate, requireId, handleRepoError, type RouteArgs } from "./_utils.js";

const uuidField = z.string().uuid();

const createSchema = financialEntryCreateSchema.extend({
  userId: uuidField,
});

export async function loader({ request }: RouteArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  try {
    if (id) return json(await financialEntryRepo.findById(id));

    return json(await financialEntryRepo.findAll({
      type: url.searchParams.get("type") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      categoryId: url.searchParams.get("categoryId") ?? undefined,
      costCenterId: url.searchParams.get("costCenterId") ?? undefined,
      dateFrom: parseDate(url.searchParams.get("dateFrom")),
      dateTo: parseDate(url.searchParams.get("dateTo")),
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
      const data = createSchema.parse(body) as CreateFinancialEntryData;

      return json(await financialEntryRepo.create(data), { status: 201 });
    }

    if (request.method === "PUT") {
      requireId(id);
      const body = await request.json();

      return json(await financialEntryRepo.update(id!, financialEntryUpdateSchema.parse(body)));
    }

    if (request.method === "DELETE") {
      requireId(id);

      return json(await financialEntryRepo.softDelete(id!));
    }

    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) {
    return handleRepoError(err);
  }
}
