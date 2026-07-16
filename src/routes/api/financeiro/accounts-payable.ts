import {
  accountPayableRepo,
  type CreateAccountPayableData,
} from "../../../server/financeiro/repositories.js";
import {
  accountPayableCreateSchema,
  accountPayableUpdateSchema,
  accountPayableFilterSchema,
} from "../../../domain/financeiro/schemas.js";
import {
  payAccountPayable,
  reverseAccountPayablePayment,
} from "../../../server/financeiro/accounts-payable-service.js";
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

const updateSchema = accountPayableUpdateSchema.extend({
  userId: uuidField.optional(),
  expectedUpdatedAt: z.coerce.date().optional(),
});

const paymentSchema = z.object({
  status: z.literal("paid"),
  paymentDate: z.coerce.date(),
  paidAmount: z.coerce.number().positive(),
  discountAmount: z.coerce.number().min(0).optional(),
  interestAmount: z.coerce.number().min(0).optional(),
  penaltyAmount: z.coerce.number().min(0).optional(),
  paymentMethod: z.string().min(1),
  bankAccount: z.string().optional(),
  notes: z.string().optional(),
  userId: uuidField,
});

const reversalSchema = z.object({
  status: z.literal("reversed"),
  reversalDate: z.coerce.date(),
  reason: z.string().min(1),
  notes: z.string().optional(),
  userId: uuidField,
});

const loaderFilterSchema = accountPayableFilterSchema
  .extend({
    supplier: z.string().optional(),
  })
  .passthrough();

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
    if (id) return json(await accountPayableRepo.findById(id));

    const raw = {
      status: url.searchParams.get("status") ?? undefined,
      categoryId: url.searchParams.get("categoryId") ?? undefined,
      costCenterId: url.searchParams.get("costCenterId") ?? undefined,
      beneficiaryType: url.searchParams.get("beneficiaryType") ?? undefined,
      beneficiaryId: url.searchParams.get("beneficiaryId") ?? undefined,
      supplier: url.searchParams.get("supplier") ?? undefined,
      dueDateFrom: parseDate(url.searchParams.get("dueDateFrom")),
      dueDateTo: parseDate(url.searchParams.get("dueDateTo")),
      search: url.searchParams.get("search") ?? undefined,
    };

    const parsed = loaderFilterSchema.parse(raw);

    return json(
      await accountPayableRepo.findAll({
        ...parsed,
        beneficiaryType: parsed.beneficiaryType as
          | "supplier"
          | "collaborator"
          | undefined,
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
        ...(createSchema.parse(body) as CreateAccountPayableData),
        userId: actorUserId,
      };
      if (data.status === "paid" || data.status === "reversed") {
        throw businessError(
          "Conta a pagar paga ou estornada deve ser registrada por rotina transacional propria.",
          409
        );
      }

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
          await reverseAccountPayablePayment(id!, {
            reversalDate: data.reversalDate,
            reason: data.reason.trim(),
            notes: data.notes?.trim() || null,
            userId: actorUserId,
          })
        );
      }

      const currentAccount = await accountPayableRepo.findById(id!);
      if (currentAccount.status === "paid" || currentAccount.status === "reversed") {
        throw businessError(
          "Conta paga ou estornada nao pode ser editada diretamente.",
          409
        );
      }

      return json(
        await accountPayableRepo.update(
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
      const currentAccount = await accountPayableRepo.findById(id!);
      if (currentAccount.status === "paid" || currentAccount.status === "reversed") {
        throw businessError(
          "Conta paga ou estornada nao pode ser excluida.",
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
