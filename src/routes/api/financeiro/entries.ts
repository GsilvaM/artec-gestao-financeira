import {
  financialEntryRepo,
  type CreateFinancialEntryData,
} from "../../../server/financeiro/repositories.js";
import {
  financialEntryCreateSchema,
  financialEntryUpdateSchema,
} from "../../../domain/financeiro/schemas.js";
import { isAccountOriginatedEntry } from "../../../server/financeiro/financial-origin.js";
import { z } from "zod";
import {
  json,
  parseDate,
  requireId,
  handleRepoError,
  type RouteArgs,
} from "./_utils.js";

const uuidField = z.string().uuid();

const createSchema = financialEntryCreateSchema.extend({
  userId: uuidField,
});

function businessError(message: string, status = 400) {
  return Object.assign(new Error(message), { name: "ValidationError", status });
}

export async function loader({ request }: RouteArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  try {
    if (id) return json(await financialEntryRepo.findById(id));

    return json(
      await financialEntryRepo.findAll({
        type: url.searchParams.get("type") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        categoryId: url.searchParams.get("categoryId") ?? undefined,
        costCenterId: url.searchParams.get("costCenterId") ?? undefined,
        collaboratorId: url.searchParams.get("collaboratorId") ?? undefined,
        paymentMethod: url.searchParams.get("paymentMethod") ?? undefined,
        bankAccount: url.searchParams.get("bankAccount") ?? undefined,
        origin: url.searchParams.get("origin") ?? undefined,
        dateFrom: parseDate(url.searchParams.get("dateFrom")),
        dateTo: parseDate(url.searchParams.get("dateTo")),
        search: url.searchParams.get("search") ?? undefined,
      })
    );
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
      if (isAccountOriginatedEntry(data.notes)) {
        throw businessError(
          "Lancamento com origem de contas a pagar/receber deve ser criado pela rotina da conta.",
          409
        );
      }

      return json(await financialEntryRepo.create(data), { status: 201 });
    }

    if (request.method === "PUT") {
      requireId(id);
      const body = await request.json();
      const currentEntry = await financialEntryRepo.findById(id!);
      if (isAccountOriginatedEntry(currentEntry.notes)) {
        throw businessError(
          "Lancamento originado de contas a pagar/receber nao pode ser editado diretamente. Use a rotina de estorno da origem.",
          409
        );
      }

      return json(
        await financialEntryRepo.update(
          id!,
          financialEntryUpdateSchema.parse(body)
        )
      );
    }

    if (request.method === "DELETE") {
      requireId(id);
      const currentEntry = await financialEntryRepo.findById(id!);
      if (isAccountOriginatedEntry(currentEntry.notes)) {
        throw businessError(
          "Lancamento originado de contas a pagar/receber nao pode ser excluido diretamente. Use a rotina de estorno da origem.",
          409
        );
      }

      return json(await financialEntryRepo.softDelete(id!));
    }

    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) {
    return handleRepoError(err);
  }
}
