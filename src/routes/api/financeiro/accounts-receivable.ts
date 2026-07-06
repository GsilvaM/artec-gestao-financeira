import {
  accountReceivableRepo,
  type CreateAccountReceivableData,
} from "../../../server/financeiro/repositories.js";
import {
  accountReceivableCreateSchema,
  accountReceivableUpdateSchema,
} from "../../../domain/financeiro/schemas.js";
import { receiveAccountReceivable } from "../../../server/financeiro/accounts-receivable-service.js";
import { z } from "zod";
import {
  json,
  parseDate,
  requireId,
  handleRepoError,
  type RouteArgs,
} from "./_utils.js";

const uuidField = z.string().uuid();

const createSchema = accountReceivableCreateSchema.extend({
  userId: uuidField,
});

const receiptSchema = z.object({
  status: z.literal("received"),
  receivedDate: z.coerce.date(),
  receivedAmount: z.coerce.number().positive(),
  paymentMethod: z.string().min(1),
  bankAccount: z.string().optional(),
  notes: z.string().optional(),
  userId: uuidField,
});

function businessError(message: string, status = 400) {
  return Object.assign(new Error(message), { name: "ValidationError", status });
}

export async function loader({ request }: RouteArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  try {
    if (id) return json(await accountReceivableRepo.findById(id));
    return json(
      await accountReceivableRepo.findAll({
        status: url.searchParams.get("status") ?? undefined,
        categoryId: url.searchParams.get("categoryId") ?? undefined,
        costCenterId: url.searchParams.get("costCenterId") ?? undefined,
        client: url.searchParams.get("client") ?? undefined,
        dueDateFrom: parseDate(url.searchParams.get("dueDateFrom")),
        dueDateTo: parseDate(url.searchParams.get("dueDateTo")),
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
      const data = createSchema.parse(body) as CreateAccountReceivableData;

      return json(await accountReceivableRepo.create(data), { status: 201 });
    }
    if (request.method === "PUT") {
      requireId(id);
      const body = await request.json();
      if (
        body &&
        typeof body === "object" &&
        "status" in body &&
        body.status === "received"
      ) {
        const data = receiptSchema.parse(body);
        return json(
          await receiveAccountReceivable(id!, {
            receivedDate: data.receivedDate,
            receivedAmount: data.receivedAmount,
            paymentMethod: data.paymentMethod,
            bankAccount: data.bankAccount?.trim() || null,
            notes: data.notes?.trim() || null,
            userId: data.userId,
          })
        );
      }

      const currentAccount = await accountReceivableRepo.findById(id!);
      if (currentAccount.status === "received") {
        throw businessError(
          "Conta recebida nao pode ser editada diretamente. Defina uma rotina de estorno antes de alterar.",
          409
        );
      }

      return json(
        await accountReceivableRepo.update(
          id!,
          accountReceivableUpdateSchema.parse(body)
        )
      );
    }
    if (request.method === "DELETE") {
      requireId(id);
      const currentAccount = await accountReceivableRepo.findById(id!);
      if (currentAccount.status === "received") {
        throw businessError(
          "Conta recebida nao pode ser excluida. Defina uma rotina de estorno antes de remover.",
          409
        );
      }

      return json(await accountReceivableRepo.softDelete(id!));
    }
    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) {
    return handleRepoError(err);
  }
}
