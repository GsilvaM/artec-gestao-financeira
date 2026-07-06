import { beforeEach, describe, expect, it, vi } from "vitest";
import { payAccountPayable, reverseAccountPayablePayment } from "@/server/financeiro/accounts-payable-service";
import { prisma } from "@/lib/prisma/client.js";

vi.mock("@/lib/prisma/client.js", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

const ACCOUNT_ID = "22222222-2222-2222-2222-222222222222";
const USER_ID = "00000000-0000-0000-0000-000000000002";
const CATEGORY_ID = "00000000-0000-0000-0000-000000000001";

const account = {
  id: ACCOUNT_ID,
  description: "Fornecedor OS 123",
  amount: 300,
  dueDate: new Date("2026-07-05T00:00:00"),
  paidDate: null,
  status: "pending",
  categoryId: CATEGORY_ID,
  costCenterId: null,
  supplier: "Fornecedor Artec",
  userId: USER_ID,
  notes: "Observacao original",
  createdAt: new Date("2026-07-01T00:00:00"),
  updatedAt: new Date("2026-07-01T00:00:00"),
  deletedAt: null,
  category: { id: CATEGORY_ID, name: "Materiais", type: "despesa" },
  costCenter: null,
};

const paidAccount = {
  ...account,
  status: "paid",
  paidDate: new Date("2026-07-06T00:00:00"),
};

const createdFinancialEntry = {
  id: "55555555-5555-5555-5555-555555555555",
  description: account.description,
  amount: 300,
  type: "despesa",
  date: new Date("2026-07-06T00:00:00"),
  status: "confirmed",
  categoryId: CATEGORY_ID,
  costCenterId: null,
  collaboratorId: null,
  clientName: account.supplier,
  userId: USER_ID,
  notes: `[originType=accounts_payable;originId=${ACCOUNT_ID}]`,
  createdAt: new Date("2026-07-06T00:00:00"),
  updatedAt: new Date("2026-07-06T00:00:00"),
  deletedAt: null,
  category: account.category,
  costCenter: null,
  collaborator: null,
};

describe("payAccountPayable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the payable and creates a confirmed expense entry in one transaction", async () => {
    const tx = {
      accountPayable: {
        findFirst: vi.fn().mockResolvedValue(account),
        update: vi.fn().mockResolvedValue(paidAccount),
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

    const paymentDate = new Date("2026-07-06T00:00:00");
    const result = await payAccountPayable(ACCOUNT_ID, {
      paymentDate,
      paidAmount: 300,
      paymentMethod: "pix",
      bankAccount: "Banco teste",
      notes: "Pago com desconto",
      userId: USER_ID,
    });

    expect(tx.accountPayable.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "paid", paidDate: paymentDate }),
      })
    );
    expect(tx.financialEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "despesa",
          status: "confirmed",
          notes: expect.stringContaining(
            `[originType=accounts_payable;originId=${ACCOUNT_ID}]`
          ),
        }),
      })
    );
    expect(result.financialEntry).toBe(createdFinancialEntry);
  });
});

describe("reverseAccountPayablePayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks payable and linked financial entry as reversed in one transaction", async () => {
    const tx = {
      accountPayable: {
        findFirst: vi.fn().mockResolvedValue(paidAccount),
        update: vi.fn().mockResolvedValue({ ...paidAccount, status: "reversed" }),
      },
      financialEntry: {
        findFirst: vi.fn().mockResolvedValue(createdFinancialEntry),
        update: vi.fn().mockResolvedValue({
          ...createdFinancialEntry,
          status: "reversed",
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
    const result = await reverseAccountPayablePayment(ACCOUNT_ID, {
      reversalDate,
      reason: "Pagamento incorreto",
      notes: "Duplicado no banco",
      userId: USER_ID,
    });

    expect(tx.accountPayable.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "reversed" },
      })
    );
    expect(tx.financialEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "reversed",
          notes: expect.stringContaining("Motivo do estorno: Pagamento incorreto"),
        }),
      })
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "account_payable_payment_reversed",
          metadata: expect.objectContaining({
            reason: "Pagamento incorreto",
          }),
        }),
      })
    );
    expect(result.account.status).toBe("reversed");
  });

  it("reconstructs a missing legacy financial entry before reversing it", async () => {
    const reconstructedEntry = {
      ...createdFinancialEntry,
      id: "77777777-7777-7777-7777-777777777777",
      notes: `[originType=accounts_payable;originId=${ACCOUNT_ID}]\n[legacyReconstruction=true]`,
    };
    const tx = {
      accountPayable: {
        findFirst: vi.fn().mockResolvedValue({
          ...paidAccount,
          paidDate: null,
        }),
        update: vi.fn().mockResolvedValue({ ...paidAccount, status: "reversed" }),
      },
      financialEntry: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(reconstructedEntry),
        update: vi.fn().mockResolvedValue({
          ...reconstructedEntry,
          status: "reversed",
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-id" }),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(tx as unknown as Parameters<typeof callback>[0])
    );

    await reverseAccountPayablePayment(ACCOUNT_ID, {
      reversalDate: new Date("2026-07-07T00:00:00"),
      reason: "Pagamento legado incorreto",
      userId: USER_ID,
    });

    expect(tx.financialEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "despesa",
          status: "confirmed",
          amount: paidAccount.amount,
          notes: expect.stringContaining("[legacyReconstruction=true]"),
        }),
      })
    );
    expect(tx.financialEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: reconstructedEntry.id },
        data: expect.objectContaining({ status: "reversed" }),
      })
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "financial_entry_reconstructed_from_account_payable",
        }),
      })
    );
  });

  it("reconciles a paid account when the linked financial entry is already reversed", async () => {
    const reversedEntry = {
      ...createdFinancialEntry,
      status: "reversed",
      notes: `[originType=accounts_payable;originId=${ACCOUNT_ID}]`,
    };
    const tx = {
      accountPayable: {
        findFirst: vi.fn().mockResolvedValue(paidAccount),
        update: vi.fn().mockResolvedValue({ ...paidAccount, status: "reversed" }),
      },
      financialEntry: {
        findFirst: vi.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(reversedEntry),
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

    const result = await reverseAccountPayablePayment(ACCOUNT_ID, {
      reversalDate: new Date("2026-07-07T00:00:00"),
      reason: "Finalizar estorno parcial",
      userId: USER_ID,
    });

    expect(tx.accountPayable.update).toHaveBeenCalledWith(
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
          action: "account_payable_reconciled_after_reversed_entry",
        }),
      })
    );
    expect(result.account.status).toBe("reversed");
    expect(result.financialEntry).toBe(reversedEntry);
  });
});
