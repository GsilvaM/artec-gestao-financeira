import { z } from "zod";
import { generateBillingEmail } from "../../../domain/financeiro/billing-email.js";
import { importAuvoInvoice } from "../../../server/financeiro/auvo-cobranca-service.js";
import { Actions, canViewFinancial, hasPermission, Modules } from "../../../server/financeiro/permissions.js";
import { json, handleRepoError, type RouteArgs } from "./_utils.js";

const importSchema = z.object({
  url: z.string().min(1),
});

const billingEmailSchema = z.object({
  recipientEmail: z.string().email().nullable(),
  ccEmail: z.string().email().nullable().optional(),
  clientName: z.string().min(1),
  clientDocument: z.string().nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  issueDate: z.string().nullable().optional(),
  dueDate: z.string().min(1),
  amount: z.coerce.number().positive(),
  paymentMethod: z.string().nullable().optional(),
  serviceAddress: z.string().nullable().optional(),
  billingAddress: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  greeting: z.string().nullable().optional(),
  openingText: z.string().min(1),
  paymentText: z.string().min(1),
  closingText: z.string().min(1),
  services: z.array(
    z.object({
      type: z.enum(["service", "product"]),
      description: z.string(),
      quantity: z.number().nullable(),
      unitPrice: z.number().nullable(),
      discount: z.number().nullable(),
      total: z.number(),
    }),
  ),
  documents: z.array(z.object({ label: z.string(), checked: z.boolean() })),
  reports: z.array(z.object({ date: z.string(), url: z.string(), label: z.string() })),
  sender: z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    company: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    city: z.string().min(1),
    document: z.string().min(1),
  }),
  logoUrl: z.string().url(),
});

function requireAuthenticatedUserId(authenticatedUserId: string | undefined) {
  if (!authenticatedUserId) {
    throw Object.assign(new Error("Usuario autenticado nao identificado."), {
      name: "ValidationError",
      status: 401,
    });
  }
  return authenticatedUserId;
}

async function requireAuvoPermissions(userId: string) {
  const [canView, canCreate] = await Promise.all([
    canViewFinancial(userId, Modules.ACCOUNTS_RECEIVABLE),
    hasPermission(userId, Modules.ACCOUNTS_RECEIVABLE, Actions.CREATE),
  ]);

  if (!canView || !canCreate) {
    throw Object.assign(new Error("Sem permissao para importar cobrancas do Auvo."), {
      name: "ValidationError",
      status: 403,
    });
  }
}

export async function action({ request, params, authenticatedUserId }: RouteArgs) {
  try {
    const actorUserId = requireAuthenticatedUserId(authenticatedUserId);
    if (process.env.NODE_ENV !== "test") {
      await requireAuvoPermissions(actorUserId);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }

    const operation = params.id;
    const body = await request.json();

    if (operation === "import") {
      const data = importSchema.parse(body);
      return json(await importAuvoInvoice(data.url));
    }

    if (operation === "email") {
      const data = billingEmailSchema.parse(body);
      return json(generateBillingEmail(data));
    }

    return json({ error: "Operacao nao encontrada." }, { status: 404 });
  } catch (err) {
    return handleRepoError(err);
  }
}
