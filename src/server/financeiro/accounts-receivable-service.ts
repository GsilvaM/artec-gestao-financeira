import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma/client.js";
import { NotFoundError } from "./repositories.js";

export interface ReceiveAccountReceivableInput {
  receivedDate: Date;
  receivedAmount: number | Prisma.Decimal;
  paymentMethod: string;
  bankAccount?: string | null;
  notes?: string | null;
  userId: string;
}

const ORIGIN_TYPE = "accounts_receivable";

function originMarker(accountReceivableId: string) {
  return `[originType=${ORIGIN_TYPE};originId=${accountReceivableId}]`;
}

function buildFinancialEntryNotes(
  accountReceivableId: string,
  input: ReceiveAccountReceivableInput
) {
  const metadata = [
    originMarker(accountReceivableId),
    `Forma de recebimento: ${input.paymentMethod}`,
    input.bankAccount ? `Conta/Banco: ${input.bankAccount}` : null,
    input.notes ? `Observacoes do recebimento: ${input.notes}` : null,
  ].filter(Boolean);

  return metadata.join("\n");
}

function buildFinancialEntryData(
  accountReceivableId: string,
  account: {
    description: string;
    categoryId: string;
    costCenterId: string | null;
    client: string | null;
  },
  input: ReceiveAccountReceivableInput
): Prisma.FinancialEntryCreateInput {
  return {
    description: account.description,
    amount: input.receivedAmount,
    type: "receita",
    date: input.receivedDate,
    status: "confirmed",
    category: { connect: { id: account.categoryId } },
    ...(account.costCenterId
      ? { costCenter: { connect: { id: account.costCenterId } } }
      : {}),
    clientName: account.client,
    userId: input.userId,
    notes: buildFinancialEntryNotes(accountReceivableId, input),
  };
}

function businessError(message: string, status = 400) {
  return Object.assign(new Error(message), { name: "ValidationError", status });
}

export async function receiveAccountReceivable(
  accountReceivableId: string,
  input: ReceiveAccountReceivableInput
) {
  if (!Number.isFinite(input.receivedDate.getTime())) {
    throw businessError("Informe uma data de recebimento valida.");
  }

  if (
    !Number.isFinite(Number(input.receivedAmount)) ||
    Number(input.receivedAmount) <= 0
  ) {
    throw businessError("Informe um valor recebido valido.");
  }

  if (!input.paymentMethod.trim()) {
    throw businessError("Informe a forma de recebimento.");
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.accountReceivable.findFirst({
      where: { id: accountReceivableId, deletedAt: null },
      include: { category: true, costCenter: true },
    });

    if (!account)
      throw new NotFoundError("AccountReceivable", accountReceivableId);

    const existingFinancialEntry = await tx.financialEntry.findFirst({
      where: {
        deletedAt: null,
        notes: { contains: originMarker(accountReceivableId) },
      },
    });

    if (account.status === "received" || existingFinancialEntry) {
      throw businessError(
        "Esta conta ja foi recebida e o lancamento financeiro ja existe.",
        409
      );
    }

    if (account.status === "cancelled") {
      throw businessError("Conta cancelada nao pode ser recebida.", 409);
    }

    const receivedAccount = await tx.accountReceivable.update({
      where: { id: accountReceivableId },
      data: {
        status: "received",
        receivedDate: input.receivedDate,
        notes: account.notes ?? null,
      },
      include: { category: true, costCenter: true },
    });

    const financialEntryData = buildFinancialEntryData(
      accountReceivableId,
      account,
      input
    );

    const financialEntry = await tx.financialEntry.create({
      data: financialEntryData,
      include: { category: true, costCenter: true, collaborator: true },
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: "account_receivable_received",
        entity: "AccountReceivable",
        entityId: accountReceivableId,
        metadata: {
          receivedAmount: Number(input.receivedAmount),
          receivedDate: input.receivedDate.toISOString(),
          paymentMethod: input.paymentMethod,
          bankAccount: input.bankAccount ?? null,
          financialEntryId: financialEntry.id,
          financialEntry: {
            amount: Number(input.receivedAmount),
            date: input.receivedDate.toISOString(),
            type: "receita",
            status: "confirmed",
            categoryId: account.categoryId,
            costCenterId: account.costCenterId,
            clientName: account.client,
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: "financial_entry_created_from_account_receivable",
        entity: "FinancialEntry",
        entityId: financialEntry.id,
        metadata: {
          originType: ORIGIN_TYPE,
          originId: accountReceivableId,
        },
      },
    });

    return {
      account: receivedAccount,
      financialEntry,
      message:
        "Recebimento registrado com sucesso. Um lancamento de receita foi criado automaticamente no Financeiro.",
    };
  });
}
