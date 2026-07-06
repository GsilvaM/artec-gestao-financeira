import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma/client.js";
import { NotFoundError } from "./repositories.js";

export interface PayAccountPayableInput {
  paymentDate: Date;
  paidAmount: number | Prisma.Decimal;
  paymentMethod: string;
  bankAccount?: string | null;
  notes?: string | null;
  userId: string;
}

const ORIGIN_TYPE = "accounts_payable";

function originMarker(accountPayableId: string) {
  return `[originType=${ORIGIN_TYPE};originId=${accountPayableId}]`;
}

function buildFinancialEntryNotes(accountPayableId: string, input: PayAccountPayableInput) {
  const metadata = [
    originMarker(accountPayableId),
    `Forma de pagamento: ${input.paymentMethod}`,
    input.bankAccount ? `Conta/Banco: ${input.bankAccount}` : null,
    input.notes ? `Observações do pagamento: ${input.notes}` : null,
  ].filter(Boolean);

  return metadata.join("\n");
}

function businessError(message: string, status = 400) {
  return Object.assign(new Error(message), { name: "ValidationError", status });
}

export async function payAccountPayable(accountPayableId: string, input: PayAccountPayableInput) {
  if (!Number.isFinite(Number(input.paidAmount)) || Number(input.paidAmount) <= 0) {
    throw businessError("Informe um valor pago válido.");
  }

  if (!input.paymentMethod.trim()) {
    throw businessError("Informe a forma de pagamento.");
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.accountPayable.findFirst({
      where: { id: accountPayableId, deletedAt: null },
      include: { category: true, costCenter: true },
    });

    if (!account) throw new NotFoundError("AccountPayable", accountPayableId);

    const existingFinancialEntry = await tx.financialEntry.findFirst({
      where: {
        deletedAt: null,
        notes: { contains: originMarker(accountPayableId) },
      },
    });

    if (account.status === "paid" || existingFinancialEntry) {
      throw businessError("Esta conta já está paga e o lançamento financeiro já existe.", 409);
    }

    const paidAccount = await tx.accountPayable.update({
      where: { id: accountPayableId },
      data: {
        status: "paid",
        paidDate: input.paymentDate,
        notes: account.notes ?? null,
      },
      include: { category: true, costCenter: true },
    });

    const financialEntry = await tx.financialEntry.create({
      data: {
        description: account.description,
        amount: input.paidAmount,
        type: "despesa",
        date: input.paymentDate,
        status: "confirmed",
        categoryId: account.categoryId,
        costCenterId: account.costCenterId,
        clientName: account.supplier,
        userId: input.userId,
        notes: buildFinancialEntryNotes(accountPayableId, input),
      },
      include: { category: true, costCenter: true, collaborator: true },
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: "account_payable_paid",
        entity: "AccountPayable",
        entityId: accountPayableId,
        metadata: {
          paidAmount: Number(input.paidAmount),
          paymentDate: input.paymentDate.toISOString(),
          paymentMethod: input.paymentMethod,
          bankAccount: input.bankAccount ?? null,
          financialEntryId: financialEntry.id,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: "financial_entry_created_from_account_payable",
        entity: "FinancialEntry",
        entityId: financialEntry.id,
        metadata: {
          originType: ORIGIN_TYPE,
          originId: accountPayableId,
        },
      },
    });

    return {
      account: paidAccount,
      financialEntry,
      message: "Pagamento registrado com sucesso. Um lançamento de despesa foi criado automaticamente no Financeiro.",
    };
  });
}
