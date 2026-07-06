import { beforeEach, describe, expect, it, vi } from "vitest";
import { receiveAccountReceivable } from "@/server/financeiro/accounts-receivable-service";
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
});
