import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  receiveAccountReceivable,
  reverseAccountReceivableReceipt,
} from "@/server/financeiro/accounts-receivable-service";
import { prisma } from "@/lib/prisma/client.js";

vi.mock("@/lib/prisma/client.js", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

const ACCOUNT_ID = "33333333-3333-3333-3333-333333333333";
const USER_ID = "00000000-0000-0000-0000-000000000002";
const CATEGORY_ID = "00000000-0000-0000-0000-000000000001";
const COST_CENTER_ID = "00000000-0000-0000-0000-000000000003";

const account = {
  id: ACCOUNT_ID,
  description: "Parcela OS 123",
  amount: 500,
  dueDate: new Date("2026-07-05T00:00:00"),
  receivedDate: null,
  status: "pending",
  categoryId: CATEGORY_ID,
  costCenterId: COST_CENTER_ID,
  client: "Cliente Artec",
  userId: USER_ID,
  notes: "Observacao original",
  createdAt: new Date("2026-07-01T00:00:00"),
  updatedAt: new Date("2026-07-01T00:00:00"),
  deletedAt: null,
  category: { id: CATEGORY_ID, name: "Servicos", type: "receita" },
  costCenter: { id: COST_CENTER_ID, name: "Manutencao" },
};

const receivedAccount = {
  ...account,
  status: "received",
  receivedDate: new Date("2026-07-06T00:00:00"),
};

const createdFinancialEntry = {
  id: "44444444-4444-4444-4444-444444444444",
  description: account.description,
  amount: 475,
  type: "receita",
  date: new Date("2026-07-06T00:00:00"),
  status: "confirmed",
  categoryId: CATEGORY_ID,
  costCenterId: COST_CENTER_ID,
  collaboratorId: null,
  clientName: account.client,
  userId: USER_ID,
  notes: null,
  createdAt: new Date("2026-07-06T00:00:00"),
  updatedAt: new Date("2026-07-06T00:00:00"),
  deletedAt: null,
  category: account.category,
  costCenter: account.costCenter,
  collaborator: null,
};

describe("receiveAccountReceivable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the receivable and creates a confirmed revenue entry from receipt data in one transaction", async () => {
    const tx = {
      accountReceivable: {
        findFirst: vi.fn().mockResolvedValue(account),
        update: vi.fn().mockResolvedValue(receivedAccount),
      },
      financialEntry: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createdFinancialEntry),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-id" }),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(tx as unknown as Parameters<typeof callback>[0])
    );

    const receivedDate = new Date("2026-07-06T00:00:00");
    const result = await receiveAccountReceivable(ACCOUNT_ID, {
      receivedDate,
      receivedAmount: 475,
      discountAmount: 25,
      paymentMethod: "pix",
      bankAccount: "Banco teste",
      notes: "Desconto combinado",
      userId: USER_ID,
    });

    expect(tx.accountReceivable.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ACCOUNT_ID },
        data: expect.objectContaining({
          status: "received",
          receivedDate,
        }),
      })
    );
    expect(tx.financialEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: account.description,
          amount: 475,
          grossAmount: 500,
          discountAmount: 25,
          paymentMethod: "pix",
          bankAccount: "Banco teste",
          originType: "accounts_receivable",
          originId: ACCOUNT_ID,
          type: "receita",
          date: receivedDate,
          status: "confirmed",
          category: { connect: { id: CATEGORY_ID } },
          costCenter: { connect: { id: COST_CENTER_ID } },
          clientName: "Cliente Artec",
          userId: USER_ID,
          notes: expect.stringContaining(
            `[originType=accounts_receivable;originId=${ACCOUNT_ID}]`
          ),
        }),
      })
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "account_receivable_received",
          metadata: expect.objectContaining({
            financialEntry: expect.objectContaining({
              amount: 475,
              date: receivedDate.toISOString(),
              type: "receita",
              status: "confirmed",
              categoryId: CATEGORY_ID,
              costCenterId: COST_CENTER_ID,
              clientName: "Cliente Artec",
            }),
          }),
        }),
      })
    );
    expect(result.financialEntry).toBe(createdFinancialEntry);
  });

  it("rejects divergent receipt values without explicit adjustments", async () => {
    const tx = {
      accountReceivable: {
        findFirst: vi.fn().mockResolvedValue(account),
        update: vi.fn(),
      },
      financialEntry: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(tx as unknown as Parameters<typeof callback>[0])
    );

    await expect(
      receiveAccountReceivable(ACCOUNT_ID, {
        receivedDate: new Date("2026-07-06T00:00:00"),
        receivedAmount: 475,
        paymentMethod: "pix",
        userId: USER_ID,
      })
    ).rejects.toThrow("Valor recebido divergente");

    expect(tx.accountReceivable.update).not.toHaveBeenCalled();
    expect(tx.financialEntry.create).not.toHaveBeenCalled();
  });
});

describe("reverseAccountReceivableReceipt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks receivable as reversed and creates a reversal expense entry in one transaction", async () => {
    const reversalEntry = {
      ...createdFinancialEntry,
      id: "88888888-8888-8888-8888-888888888888",
      description: `Estorno: ${createdFinancialEntry.description}`,
      type: "despesa",
      date: new Date("2026-07-07T00:00:00"),
      notes: `[originType=reversal;originId=accounts_receivable:${ACCOUNT_ID}]`,
    };
    const tx = {
      accountReceivable: {
        findFirst: vi.fn().mockResolvedValue(receivedAccount),
        update: vi.fn().mockResolvedValue({
          ...receivedAccount,
          status: "reversed",
        }),
      },
      financialEntry: {
        findMany: vi.fn()
          .mockResolvedValueOnce([{
            ...createdFinancialEntry,
            notes: `[originType=accounts_receivable;originId=${ACCOUNT_ID}]`,
          }])
          .mockResolvedValueOnce([]),
        create: vi.fn().mockResolvedValue(reversalEntry),
        update: vi.fn().mockResolvedValue({
          ...createdFinancialEntry,
          notes: `${createdFinancialEntry.notes}\nMotivo do estorno: Recebimento incorreto`,
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-id" }),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(tx as unknown as Parameters<typeof callback>[0])
    );

    const reversalDate = new Date("2026-07-07T00:00:00");
    const result = await reverseAccountReceivableReceipt(ACCOUNT_ID, {
      reversalDate,
      reason: "Recebimento incorreto",
      notes: "Duplicado no banco",
      userId: USER_ID,
    });

    expect(tx.accountReceivable.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "reversed" },
      })
    );
    expect(tx.financialEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notes: expect.stringContaining(
            "Motivo do estorno: Recebimento incorreto"
          ),
        }),
      })
    );
    expect(tx.financialEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: `Estorno: ${createdFinancialEntry.description}`,
          amount: createdFinancialEntry.amount,
          type: "despesa",
          status: "confirmed",
          notes: expect.stringContaining(
            `[originType=reversal;originId=accounts_receivable:${ACCOUNT_ID}]`
          ),
        }),
      })
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "account_receivable_receipt_reversed",
          metadata: expect.objectContaining({
            reason: "Recebimento incorreto",
            reversalEntryId: reversalEntry.id,
          }),
        }),
      })
    );
    expect(result.account.status).toBe("reversed");
    expect(result.financialEntry?.status).toBe("confirmed");
    expect(result.reversalEntry).toBe(reversalEntry);
  });

  it("reconstructs a missing legacy financial entry before reversing it", async () => {
    const reconstructedEntry = {
      ...createdFinancialEntry,
      id: "66666666-6666-6666-6666-666666666666",
      notes: `[originType=accounts_receivable;originId=${ACCOUNT_ID}]\n[legacyReconstruction=true]`,
    };
    const tx = {
      accountReceivable: {
        findFirst: vi.fn().mockResolvedValue({
          ...receivedAccount,
          receivedDate: null,
        }),
        update: vi.fn().mockResolvedValue({
          ...receivedAccount,
          status: "reversed",
        }),
      },
      financialEntry: {
        findMany: vi.fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]),
        create: vi.fn().mockResolvedValue(reconstructedEntry),
        update: vi.fn().mockResolvedValue({
          ...reconstructedEntry,
          notes: `${reconstructedEntry.notes}\nMotivo do estorno: Recebimento legado incorreto`,
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-id" }),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(tx as unknown as Parameters<typeof callback>[0])
    );

    await reverseAccountReceivableReceipt(ACCOUNT_ID, {
      reversalDate: new Date("2026-07-07T00:00:00"),
      reason: "Recebimento legado incorreto",
      userId: USER_ID,
    });

    expect(tx.financialEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "receita",
          status: "confirmed",
          amount: receivedAccount.amount,
          notes: expect.stringContaining("[legacyReconstruction=true]"),
        }),
      })
    );
    expect(tx.financialEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: reconstructedEntry.id },
        data: expect.objectContaining({
          notes: expect.stringContaining("Motivo do estorno: Recebimento legado incorreto"),
        }),
      })
    );
    expect(tx.financialEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "despesa",
          status: "confirmed",
          notes: expect.stringContaining(
            `[originType=reversal;originId=accounts_receivable:${ACCOUNT_ID}]`
          ),
        }),
      })
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "financial_entry_reconstructed_from_account_receivable",
        }),
      })
    );
  });

  it("reconciles a received account when the linked financial entry is already reversed", async () => {
    const reversedEntry = {
      ...createdFinancialEntry,
      status: "reversed",
      notes: `[originType=accounts_receivable;originId=${ACCOUNT_ID}]`,
    };
    const tx = {
      accountReceivable: {
        findFirst: vi.fn().mockResolvedValue(receivedAccount),
        update: vi.fn().mockResolvedValue({
          ...receivedAccount,
          status: "reversed",
        }),
      },
      financialEntry: {
        findMany: vi.fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([reversedEntry]),
        create: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-id" }),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(tx as unknown as Parameters<typeof callback>[0])
    );

    const result = await reverseAccountReceivableReceipt(ACCOUNT_ID, {
      reversalDate: new Date("2026-07-07T00:00:00"),
      reason: "Finalizar estorno parcial",
      userId: USER_ID,
    });

    expect(tx.accountReceivable.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ACCOUNT_ID },
        data: { status: "reversed" },
      })
    );
    expect(tx.financialEntry.create).not.toHaveBeenCalled();
    expect(tx.financialEntry.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "account_receivable_reconciled_after_reversed_entry",
        }),
      })
    );
    expect(result.account.status).toBe("reversed");
    expect(result.financialEntry).toBe(reversedEntry);
  });

  it("reconciles a received account when a reversal entry already exists", async () => {
    const reversalEntry = {
      ...createdFinancialEntry,
      id: "99999999-9999-9999-9999-999999999999",
      type: "despesa",
      notes: `[originType=reversal;originId=accounts_receivable:${ACCOUNT_ID}]`,
    };
    const tx = {
      accountReceivable: {
        findFirst: vi.fn().mockResolvedValue(receivedAccount),
        update: vi.fn().mockResolvedValue({
          ...receivedAccount,
          status: "reversed",
        }),
      },
      financialEntry: {
        findMany: vi.fn()
          .mockResolvedValueOnce([{
            ...createdFinancialEntry,
            notes: `[originType=accounts_receivable;originId=${ACCOUNT_ID}]`,
          }])
          .mockResolvedValueOnce([reversalEntry]),
        create: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-id" }),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(tx as unknown as Parameters<typeof callback>[0])
    );

    const result = await reverseAccountReceivableReceipt(ACCOUNT_ID, {
      reversalDate: new Date("2026-07-07T00:00:00"),
      reason: "Finalizar estorno parcial",
      userId: USER_ID,
    });

    expect(tx.accountReceivable.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "reversed" },
      })
    );
    expect(tx.financialEntry.create).not.toHaveBeenCalled();
    expect(tx.financialEntry.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "account_receivable_reconciled_after_reversal_entry",
        }),
      })
    );
    expect(result.financialEntry?.notes).toContain(
      `[originType=accounts_receivable;originId=${ACCOUNT_ID}]`
    );
    expect(result.reversalEntry).toBe(reversalEntry);
  });
});
