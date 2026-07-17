import {
  accountReceivableRepo,
  type CreateAccountReceivableData,
} from "../../../server/financeiro/repositories.js";
import {
  accountReceivableCreateSchema,
  accountReceivableUpdateSchema,
} from "../../../domain/financeiro/schemas.js";
import {
  receiveAccountReceivable,
  reverseAccountReceivableReceipt,
} from "../../../server/financeiro/accounts-receivable-service.js";
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

const updateSchema = accountReceivableUpdateSchema.extend({
  userId: uuidField.optional(),
});

const receiptSchema = z.object({
  status: z.literal("received"),
  receivedDate: z.coerce.date(),
  receivedAmount: z.coerce.number().positive(),
  discountAmount: z.coerce.number().min(0).optional(),
  interestAmount: z.coerce.number().min(0).optional(),
  penaltyAmount: z.coerce.number().min(0).optional(),
  paymentMethod: z.string().min(1),
  bankAccount: z.string().optional(),
  notes: z.string().optional(),
  userId: uuidField.optional(),
});

const reversalSchema = z.object({
  status: z.literal("reversed"),
  reversalDate: z.coerce.date(),
  reason: z.string().min(1),
  notes: z.string().optional(),
  userId: uuidField,
});

function businessError(message: string, status = 400) {
  return Object.assign(new Error(message), { name: "ValidationError", status });
}

function requireAuthenticatedUserId(authenticatedUserId: string | undefined) {
  if (!authenticatedUserId) {
    throw Object.assign(new Error("Usuario autenticado nao identificado."), {
      name: "ValidationError",
      status: 401,
    });
  }
  return authenticatedUserId;
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

export async function action({ request, params, authenticatedUserId }: RouteArgs) {
  const id = params.id;
  try {
    const actorUserId = requireAuthenticatedUserId(authenticatedUserId);
    if (request.method === "POST") {
      const body = await request.json();
      const data = {
        ...(createSchema.parse(body) as CreateAccountReceivableData),
        userId: actorUserId,
      };
      if (data.status === "received" || data.status === "reversed") {
        throw businessError(
          "Conta a receber recebida ou estornada deve ser registrada por rotina transacional propria.",
          409
        );
      }

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
            discountAmount: data.discountAmount,
            interestAmount: data.interestAmount,
            penaltyAmount: data.penaltyAmount,
            paymentMethod: data.paymentMethod,
            bankAccount: data.bankAccount?.trim() || null,
            notes: data.notes?.trim() || null,
            userId: actorUserId,
          })
        );
      }
      if (
        body &&
        typeof body === "object" &&
        "status" in body &&
        body.status === "reversed"
      ) {
        const data = reversalSchema.parse(body);
        return json(
          await reverseAccountReceivableReceipt(id!, {
            reversalDate: data.reversalDate,
            reason: data.reason.trim(),
            notes: data.notes?.trim() || null,
            userId: actorUserId,
          })
        );
      }

      const currentAccount = await accountReceivableRepo.findById(id!);
      if (currentAccount.status === "received" || currentAccount.status === "reversed") {
        throw businessError(
          "Conta recebida ou estornada nao pode ser editada diretamente.",
          409
        );
      }

      return json(
        await accountReceivableRepo.update(
          id!,
          {
            ...updateSchema.parse(body),
            userId: actorUserId,
          }
        )
      );
    }
    if (request.method === "DELETE") {
      requireId(id);
      const currentAccount = await accountReceivableRepo.findById(id!);
      if (currentAccount.status === "received" || currentAccount.status === "reversed") {
        throw businessError(
          "Conta recebida ou estornada nao pode ser excluida.",
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
