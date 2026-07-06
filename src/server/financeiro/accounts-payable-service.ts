import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma/client.js";
import {
  FINANCIAL_ORIGINS,
  appendMetadata,
  originMarker,
} from "./financial-origin.js";
import { NotFoundError } from "./repositories.js";

export interface PayAccountPayableInput {
  paymentDate: Date;
  paidAmount: number | Prisma.Decimal;
  paymentMethod: string;
  bankAccount?: string | null;
  notes?: string | null;
  userId: string;
}

export interface ReverseAccountPayablePaymentInput {
  reversalDate: Date;
  reason: string;
  notes?: string | null;
  userId: string;
}

function accountPayableOriginMarker(accountPayableId: string) {
  return originMarker(FINANCIAL_ORIGINS.ACCOUNTS_PAYABLE, accountPayableId);
}

function buildFinancialEntryNotes(
  accountPayableId: string,
  input: PayAccountPayableInput
) {
  const metadata = [
    accountPayableOriginMarker(accountPayableId),
    `Forma de pagamento: ${input.paymentMethod}`,
    input.bankAccount ? `Conta/Banco: ${input.bankAccount}` : null,
    input.notes ? `Observacoes do pagamento: ${input.notes}` : null,
  ].filter(Boolean);

  return metadata.join("\n");
}

function businessError(message: string, status = 400) {
  return Object.assign(new Error(message), { name: "ValidationError", status });
}

function getLegacyPaymentDate(account: {
  paidDate: Date | null;
  updatedAt: Date;
  dueDate: Date;
}) {
  return account.paidDate ?? account.updatedAt ?? account.dueDate;
}

export async function payAccountPayable(
  accountPayableId: string,
  input: PayAccountPayableInput
) {
  if (!Number.isFinite(input.paymentDate.getTime())) {
    throw businessError("Informe uma data de pagamento valida.");
  }

  if (
    !Number.isFinite(Number(input.paidAmount)) ||
    Number(input.paidAmount) <= 0
  ) {
    throw businessError("Informe um valor pago valido.");
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
        status: { not: "reversed" },
        notes: { contains: accountPayableOriginMarker(accountPayableId) },
      },
    });

    if (account.status === "paid" || existingFinancialEntry) {
      throw businessError(
        "Esta conta ja esta paga e o lancamento financeiro ja existe.",
        409
      );
    }

    if (account.status === "cancelled") {
      throw businessError("Conta cancelada nao pode ser paga.", 409);
    }

    if (account.status === "reversed") {
      throw businessError(
        "Pagamento estornado nao pode ser pago novamente sem rotina explicita de reaprovacao.",
        409
      );
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
          originType: FINANCIAL_ORIGINS.ACCOUNTS_PAYABLE,
          originId: accountPayableId,
        },
      },
    });

    return {
      account: paidAccount,
      financialEntry,
      message:
        "Pagamento registrado com sucesso. O lancamento financeiro foi criado automaticamente.",
    };
  });
}

export async function reverseAccountPayablePayment(
  accountPayableId: string,
  input: ReverseAccountPayablePaymentInput
) {
  if (!Number.isFinite(input.reversalDate.getTime())) {
    throw businessError("Informe uma data de estorno valida.");
  }

  if (!input.reason.trim()) {
    throw businessError("Informe o motivo do estorno.");
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.accountPayable.findFirst({
      where: { id: accountPayableId, deletedAt: null },
      include: { category: true, costCenter: true },
    });

    if (!account) throw new NotFoundError("AccountPayable", accountPayableId);

    if (account.status === "reversed") {
      throw businessError("Pagamento desta conta ja foi estornado.", 409);
    }

    if (account.status !== "paid") {
      throw businessError("Apenas conta paga pode ser estornada.", 409);
    }

    const originMarker = accountPayableOriginMarker(accountPayableId);
    let financialEntry = await tx.financialEntry.findFirst({
      where: {
        deletedAt: null,
        status: { not: "reversed" },
        notes: { contains: originMarker },
      },
      include: { category: true, costCenter: true, collaborator: true },
    });

    if (!financialEntry) {
      const reversedFinancialEntry = await tx.financialEntry.findFirst({
        where: {
          deletedAt: null,
          status: "reversed",
          notes: { contains: originMarker },
        },
        include: { category: true, costCenter: true, collaborator: true },
      });

      if (reversedFinancialEntry) {
        const reconciledAccount = await tx.accountPayable.update({
          where: { id: accountPayableId },
          data: { status: "reversed" },
          include: { category: true, costCenter: true },
        });

        await tx.auditLog.create({
          data: {
            userId: input.userId,
            action: "account_payable_reconciled_after_reversed_entry",
            entity: "AccountPayable",
            entityId: accountPayableId,
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
            "Pagamento reconciliado. O lancamento financeiro ja estava estornado.",
        };
      }
    }

    if (!financialEntry) {
      financialEntry = await tx.financialEntry.create({
        data: {
          description: account.description,
          amount: account.amount,
          type: "despesa",
          date: getLegacyPaymentDate(account),
          status: "confirmed",
          categoryId: account.categoryId,
          costCenterId: account.costCenterId,
          clientName: account.supplier,
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
          action: "financial_entry_reconstructed_from_account_payable",
          entity: "FinancialEntry",
          entityId: financialEntry.id,
          metadata: {
            originType: FINANCIAL_ORIGINS.ACCOUNTS_PAYABLE,
            originId: accountPayableId,
            amount: Number(account.amount),
            date: getLegacyPaymentDate(account).toISOString(),
            reason:
              "Conta paga sem lancamento financeiro vinculado encontrada durante estorno.",
          },
        },
      });
    }

    if (financialEntry.status === "reversed") {
      throw businessError("Lancamento financeiro ja esta estornado.", 409);
    }

    const reversedAccount = await tx.accountPayable.update({
      where: { id: accountPayableId },
      data: { status: "reversed" },
      include: { category: true, costCenter: true },
    });

    const reversedEntry = await tx.financialEntry.update({
      where: { id: financialEntry.id },
      data: {
        status: "reversed",
        notes: appendMetadata(financialEntry.notes, [
          `[reversalDate=${input.reversalDate.toISOString()}]`,
          `[reversalUserId=${input.userId}]`,
          `Motivo do estorno: ${input.reason.trim()}`,
          input.notes ? `Observacoes do estorno: ${input.notes}` : null,
        ]),
      },
      include: { category: true, costCenter: true, collaborator: true },
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: "account_payable_payment_reversed",
        entity: "AccountPayable",
        entityId: accountPayableId,
        metadata: {
          reversalDate: input.reversalDate.toISOString(),
          reason: input.reason.trim(),
          notes: input.notes ?? null,
          financialEntryId: financialEntry.id,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: "financial_entry_reversed_from_account_payable",
        entity: "FinancialEntry",
        entityId: financialEntry.id,
        metadata: {
          originType: FINANCIAL_ORIGINS.ACCOUNTS_PAYABLE,
          originId: accountPayableId,
          reversalDate: input.reversalDate.toISOString(),
          reason: input.reason.trim(),
        },
      },
    });

    return {
      account: reversedAccount,
      financialEntry: reversedEntry,
      message:
        "Pagamento estornado com sucesso. O lancamento financeiro foi atualizado.",
    };
  });
}
