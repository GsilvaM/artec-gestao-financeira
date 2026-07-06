import {
  accountPayableRepo,
  type CreateAccountPayableData,
} from "../../../server/financeiro/repositories.js";
import {
  accountPayableCreateSchema,
  accountPayableUpdateSchema,
} from "../../../domain/financeiro/schemas.js";
import { payAccountPayable } from "../../../server/financeiro/accounts-payable-service.js";
import { z } from "zod";
import {
  json,
  parseDate,
  requireId,
  handleRepoError,
  type RouteArgs,
} from "./_utils.js";

const uuidField = z.string().uuid();

const createSchema = accountPayableCreateSchema.extend({
  userId: uuidField,
});

const paymentSchema = z.object({
  status: z.literal("paid"),
  paymentDate: z.coerce.date(),
  paidAmount: z.coerce.number().positive(),
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
    if (id) return json(await accountPayableRepo.findById(id));
    return json(
      await accountPayableRepo.findAll({
        status: url.searchParams.get("status") ?? undefined,
        categoryId: url.searchParams.get("categoryId") ?? undefined,
        costCenterId: url.searchParams.get("costCenterId") ?? undefined,
        supplier: url.searchParams.get("supplier") ?? undefined,
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
      const data = createSchema.parse(body) as CreateAccountPayableData;

      return json(await accountPayableRepo.create(data), { status: 201 });
    }
    if (request.method === "PUT") {
      requireId(id);
      const body = await request.json();
      if (
        body &&
        typeof body === "object" &&
        "status" in body &&
        body.status === "paid"
      ) {
        const data = paymentSchema.parse(body);
        return json(
          await payAccountPayable(id!, {
            paymentDate: data.paymentDate,
            paidAmount: data.paidAmount,
            paymentMethod: data.paymentMethod,
            bankAccount: data.bankAccount?.trim() || null,
            notes: data.notes?.trim() || null,
            userId: data.userId,
          })
        );
      }

      const currentAccount = await accountPayableRepo.findById(id!);
      if (currentAccount.status === "paid") {
        throw businessError(
          "Conta paga nao pode ser editada diretamente. Defina uma rotina de estorno antes de alterar.",
          409
        );
      }

      return json(
        await accountPayableRepo.update(
          id!,
          accountPayableUpdateSchema.parse(body)
        )
      );
    }
    if (request.method === "DELETE") {
      requireId(id);
      const currentAccount = await accountPayableRepo.findById(id!);
      if (currentAccount.status === "paid") {
        throw businessError(
          "Conta paga nao pode ser excluida. Defina uma rotina de estorno antes de remover.",
          409
        );
      }

      return json(await accountPayableRepo.softDelete(id!));
    }
    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) {
    return handleRepoError(err);
  }
}
