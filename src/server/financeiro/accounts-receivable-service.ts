import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma/client.js";
import {
  FINANCIAL_ORIGINS,
  appendMetadata,
  originMarker,
  reversalOriginMarker,
} from "./financial-origin.js";
import { NotFoundError } from "./repositories.js";

export interface ReceiveAccountReceivableInput {
  receivedDate: Date;
  receivedAmount: number | Prisma.Decimal;
  discountAmount?: number | Prisma.Decimal;
  interestAmount?: number | Prisma.Decimal;
  penaltyAmount?: number | Prisma.Decimal;
  paymentMethod: string;
  bankAccount?: string | null;
  notes?: string | null;
  userId: string;
}

export interface ReverseAccountReceivableReceiptInput {
  reversalDate: Date;
  reason: string;
  notes?: string | null;
  userId: string;
}

function accountReceivableOriginMarker(accountReceivableId: string) {
  return originMarker(
    FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE,
    accountReceivableId
  );
}

function buildFinancialEntryNotes(
  accountReceivableId: string,
  input: ReceiveAccountReceivableInput
) {
  const metadata = [
    accountReceivableOriginMarker(accountReceivableId),
    `Forma de recebimento: ${input.paymentMethod}`,
    input.bankAccount ? `Conta/Banco: ${input.bankAccount}` : null,
    input.notes ? `Observacoes do recebimento: ${input.notes}` : null,
  ].filter(Boolean);

  return metadata.join("\n");
}

function buildReversalEntryNotes(
  accountReceivableId: string,
  originalFinancialEntryId: string,
  input: ReverseAccountReceivableReceiptInput
) {
  return [
    reversalOriginMarker(FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE, accountReceivableId),
    `[reversalOfOriginType=${FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE};reversalOfOriginId=${accountReceivableId}]`,
    `[reversalOfFinancialEntryId=${originalFinancialEntryId}]`,
    `[reversalDate=${input.reversalDate.toISOString()}]`,
    `[reversalUserId=${input.userId}]`,
    `Motivo do estorno: ${input.reason.trim()}`,
    input.notes ? `Observacoes do estorno: ${input.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildFinancialEntryData(
  accountReceivableId: string,
  account: {
    description: string;
    amount: number | Prisma.Decimal;
    categoryId: string;
    costCenterId: string | null;
    client: string | null;
  },
  input: ReceiveAccountReceivableInput,
  settlement: ReturnType<typeof validateSettlementAmount>
): Prisma.FinancialEntryCreateInput {
  return {
    description: account.description,
    amount: input.receivedAmount,
    grossAmount: account.amount,
    discountAmount: settlement.discountAmount,
    interestAmount: settlement.interestAmount,
    penaltyAmount: settlement.penaltyAmount,
    type: "receita",
    date: input.receivedDate,
    status: "confirmed",
    category: { connect: { id: account.categoryId } },
    ...(account.costCenterId
      ? { costCenter: { connect: { id: account.costCenterId } } }
      : {}),
    clientName: account.client,
    paymentMethod: input.paymentMethod,
    bankAccount: input.bankAccount ?? null,
    originType: FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE,
    originId: accountReceivableId,
    userId: input.userId,
    notes: buildFinancialEntryNotes(accountReceivableId, input),
  };
}

function businessError(message: string, status = 400) {
  return Object.assign(new Error(message), { name: "ValidationError", status });
}

function toMoneyNumber(value: number | Prisma.Decimal | null | undefined) {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

function validateSettlementAmount(
  accountAmount: number | Prisma.Decimal,
  receivedAmount: number | Prisma.Decimal,
  input: Pick<ReceiveAccountReceivableInput, "discountAmount" | "interestAmount" | "penaltyAmount">
) {
  const discountAmount = toMoneyNumber(input.discountAmount);
  const interestAmount = toMoneyNumber(input.interestAmount);
  const penaltyAmount = toMoneyNumber(input.penaltyAmount);

  if (discountAmount < 0 || interestAmount < 0 || penaltyAmount < 0) {
    throw businessError("Desconto, juros e multa nao podem ser negativos.");
  }

  const expectedAmount = toMoneyNumber(
    toMoneyNumber(accountAmount) - discountAmount + interestAmount + penaltyAmount
  );
  if (Math.abs(toMoneyNumber(receivedAmount) - expectedAmount) >= 0.01) {
    throw businessError(
      "Valor recebido divergente. Informe desconto, juros e multa para que o valor liquido feche com a conta."
    );
  }

  return { discountAmount, interestAmount, penaltyAmount, expectedAmount };
}

function getLegacyReceiptDate(account: {
  receivedDate: Date | null;
  updatedAt: Date;
  dueDate: Date;
}) {
  return account.receivedDate ?? account.updatedAt ?? account.dueDate;
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
        status: { not: "reversed" },
        OR: [
          {
            originType: FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE,
            originId: accountReceivableId,
          },
          { notes: { contains: accountReceivableOriginMarker(accountReceivableId) } },
        ],
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

    if (account.status === "reversed") {
      throw businessError(
        "Recebimento estornado nao pode ser recebido novamente sem rotina explicita de reaprovacao.",
        409
      );
    }

    const settlement = validateSettlementAmount(
      account.amount,
      input.receivedAmount,
      input
    );

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
      input,
      settlement
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
          grossAmount: Number(account.amount),
          discountAmount: settlement.discountAmount,
          interestAmount: settlement.interestAmount,
          penaltyAmount: settlement.penaltyAmount,
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
          originType: FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE,
          originId: accountReceivableId,
        },
      },
    });

    return {
      account: receivedAccount,
      financialEntry,
      message:
        "Recebimento registrado com sucesso. O lancamento financeiro foi criado automaticamente.",
    };
  });
}

export async function reverseAccountReceivableReceipt(
  accountReceivableId: string,
  input: ReverseAccountReceivableReceiptInput
) {
  if (!Number.isFinite(input.reversalDate.getTime())) {
    throw businessError("Informe uma data de estorno valida.");
  }

  if (!input.reason.trim()) {
    throw businessError("Informe o motivo do estorno.");
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.accountReceivable.findFirst({
      where: { id: accountReceivableId, deletedAt: null },
      include: { category: true, costCenter: true },
    });

    if (!account)
      throw new NotFoundError("AccountReceivable", accountReceivableId);

    if (account.status === "reversed") {
      throw businessError("Recebimento desta conta ja foi estornado.", 409);
    }

    if (account.status !== "received") {
      throw businessError("Apenas conta recebida pode ser estornada.", 409);
    }

    const originMarker = accountReceivableOriginMarker(accountReceivableId);
    const reversalMarker = reversalOriginMarker(
      FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE,
      accountReceivableId
    );
    let financialEntry = await tx.financialEntry.findFirst({
      where: {
        deletedAt: null,
        status: { not: "reversed" },
        OR: [
          {
            originType: FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE,
            originId: accountReceivableId,
          },
          { notes: { contains: originMarker } },
        ],
      },
      include: { category: true, costCenter: true, collaborator: true },
    });

    if (!financialEntry) {
      const reversedFinancialEntry = await tx.financialEntry.findFirst({
        where: {
          deletedAt: null,
          status: "reversed",
          OR: [
            {
              originType: FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE,
              originId: accountReceivableId,
            },
            { notes: { contains: originMarker } },
          ],
        },
        include: { category: true, costCenter: true, collaborator: true },
      });

      if (reversedFinancialEntry) {
        const reconciledAccount = await tx.accountReceivable.update({
          where: { id: accountReceivableId },
          data: { status: "reversed" },
          include: { category: true, costCenter: true },
        });

        await tx.auditLog.create({
          data: {
            userId: input.userId,
            action: "account_receivable_reconciled_after_reversed_entry",
            entity: "AccountReceivable",
            entityId: accountReceivableId,
            metadata: {
              financialEntryId: reversedFinancialEntry.id,
              reversalDate: input.reversalDate.toISOString(),
              reason: input.reason.trim(),
              notes: input.notes ?? null,
            },
          },
        });

        return {
          account: reconciledAccount,
          financialEntry: reversedFinancialEntry,
          message:
            "Recebimento reconciliado. O lancamento financeiro ja estava estornado.",
        };
      }
    }

    if (!financialEntry) {
      financialEntry = await tx.financialEntry.create({
        data: {
          description: account.description,
          amount: account.amount,
          grossAmount: account.amount,
          type: "receita",
          date: getLegacyReceiptDate(account),
          status: "confirmed",
          categoryId: account.categoryId,
          costCenterId: account.costCenterId,
          clientName: account.client,
          originType: FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE,
          originId: accountReceivableId,
          userId: account.userId,
          notes: [
            originMarker,
            "[legacyReconstruction=true]",
            "Lancamento reconstruido automaticamente antes do estorno por ausencia de vinculo historico.",
          ].join("\n"),
        },
        include: { category: true, costCenter: true, collaborator: true },
      });

      await tx.auditLog.create({
        data: {
          userId: input.userId,
          action: "financial_entry_reconstructed_from_account_receivable",
          entity: "FinancialEntry",
          entityId: financialEntry.id,
          metadata: {
            originType: FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE,
            originId: accountReceivableId,
            amount: Number(account.amount),
            date: getLegacyReceiptDate(account).toISOString(),
            reason:
              "Conta recebida sem lancamento financeiro vinculado encontrada durante estorno.",
          },
        },
      });
    }

    if (financialEntry.status === "reversed") {
      throw businessError("Lancamento financeiro ja esta estornado.", 409);
    }

    const existingReversalEntry = await tx.financialEntry.findFirst({
      where: {
        deletedAt: null,
        OR: [
          {
            originType: FINANCIAL_ORIGINS.REVERSAL,
            originId: `${FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE}:${accountReceivableId}`,
          },
          { notes: { contains: reversalMarker } },
        ],
      },
      include: { category: true, costCenter: true, collaborator: true },
    });

    if (existingReversalEntry) {
      const reconciledAccount = await tx.accountReceivable.update({
        where: { id: accountReceivableId },
        data: { status: "reversed" },
        include: { category: true, costCenter: true },
      });

      await tx.auditLog.create({
        data: {
          userId: input.userId,
          action: "account_receivable_reconciled_after_reversal_entry",
          entity: "AccountReceivable",
          entityId: accountReceivableId,
          metadata: {
            financialEntryId: financialEntry.id,
            reversalEntryId: existingReversalEntry.id,
            reversalDate: input.reversalDate.toISOString(),
            reason: input.reason.trim(),
            notes: input.notes ?? null,
          },
        },
      });

      return {
        account: reconciledAccount,
        financialEntry,
        reversalEntry: existingReversalEntry,
        message:
          "Recebimento reconciliado. O lancamento de estorno ja existia.",
      };
    }

    const reversedAccount = await tx.accountReceivable.update({
      where: { id: accountReceivableId },
      data: { status: "reversed" },
      include: { category: true, costCenter: true },
    });

    const originalEntry = await tx.financialEntry.update({
      where: { id: financialEntry.id },
      data: {
        notes: appendMetadata(financialEntry.notes, [
          `[reversalDate=${input.reversalDate.toISOString()}]`,
          `[reversalUserId=${input.userId}]`,
          `[reversalEntryOrigin=${reversalMarker}]`,
          `Motivo do estorno: ${input.reason.trim()}`,
          input.notes ? `Observacoes do estorno: ${input.notes}` : null,
        ]),
      },
      include: { category: true, costCenter: true, collaborator: true },
    });

    const reversalEntry = await tx.financialEntry.create({
      data: {
        description: `Estorno: ${financialEntry.description}`,
        amount: financialEntry.amount,
        grossAmount: financialEntry.grossAmount,
        discountAmount: financialEntry.discountAmount,
        interestAmount: financialEntry.interestAmount,
        penaltyAmount: financialEntry.penaltyAmount,
        type: "despesa",
        date: input.reversalDate,
        status: "confirmed",
        categoryId: financialEntry.categoryId,
        costCenterId: financialEntry.costCenterId,
        collaboratorId: financialEntry.collaboratorId,
        clientName: financialEntry.clientName,
        paymentMethod: financialEntry.paymentMethod,
        bankAccount: financialEntry.bankAccount,
        originType: FINANCIAL_ORIGINS.REVERSAL,
        originId: `${FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE}:${accountReceivableId}`,
        reversalOfFinancialEntryId: financialEntry.id,
        userId: input.userId,
        notes: buildReversalEntryNotes(accountReceivableId, financialEntry.id, input),
      },
      include: { category: true, costCenter: true, collaborator: true },
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: "account_receivable_receipt_reversed",
        entity: "AccountReceivable",
        entityId: accountReceivableId,
        metadata: {
          reversalDate: input.reversalDate.toISOString(),
          reason: input.reason.trim(),
          notes: input.notes ?? null,
          financialEntryId: financialEntry.id,
          reversalEntryId: reversalEntry.id,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: "financial_entry_reversed_from_account_receivable",
        entity: "FinancialEntry",
        entityId: reversalEntry.id,
        metadata: {
          originType: FINANCIAL_ORIGINS.REVERSAL,
          originId: accountReceivableId,
          reversedOriginType: FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE,
          financialEntryId: financialEntry.id,
          reversalEntryId: reversalEntry.id,
          reversalDate: input.reversalDate.toISOString(),
          reason: input.reason.trim(),
        },
      },
    });

    return {
      account: reversedAccount,
      financialEntry: originalEntry,
      reversalEntry,
      message:
        "Recebimento estornado com sucesso. Um lancamento de contrapartida foi criado.",
    };
  });
}
