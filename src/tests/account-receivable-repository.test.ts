import { beforeEach, describe, expect, it, vi } from "vitest";
import { accountReceivableRepo } from "@/server/financeiro/repositories";
import { prisma } from "@/lib/prisma/client.js";

vi.mock("@/lib/prisma/client.js", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

const USER_ID = "00000000-0000-0000-0000-000000000002";
const ACCOUNT_ID = "33333333-3333-3333-3333-333333333333";
const CATEGORY_ID = "00000000-0000-0000-0000-000000000001";

const account = {
  id: ACCOUNT_ID,
  description: "Cliente teste",
  amount: 450,
  dueDate: new Date("2026-07-05T00:00:00"),
  receivedDate: null,
  status: "pending",
  categoryId: CATEGORY_ID,
  costCenterId: null,
  client: "Cliente",
  userId: USER_ID,
  notes: null,
  createdAt: new Date("2026-07-01T00:00:00"),
  updatedAt: new Date("2026-07-01T00:00:00"),
  deletedAt: null,
  category: { id: CATEGORY_ID, name: "Servicos", type: "receita" },
  costCenter: null,
};

describe("accountReceivableRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("audits account receivable creation", async () => {
    const tx = {
      accountReceivable: {
        create: vi.fn().mockResolvedValue(account),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-id" }),
      },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(tx as unknown as Parameters<typeof callback>[0])
    );

    await accountReceivableRepo.create({
      description: account.description,
      amount: account.amount,
      dueDate: account.dueDate,
      categoryId: account.categoryId,
      costCenterId: account.costCenterId,
      client: account.client,
      userId: USER_ID,
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          action: "CREATED",
          entity: "AccountReceivable",
          entityId: ACCOUNT_ID,
          metadata: expect.objectContaining({
            entity_type: "AccountReceivable",
            changed_fields: expect.objectContaining({
              amount: { from: null, to: account.amount },
              client: { from: null, to: account.client },
            }),
          }),
        }),
      })
    );
  });

  it("audits common account receivable updates with the authenticated user", async () => {
    const updatedAccount = { ...account, description: "Cliente alterado" };
    const tx = {
      accountReceivable: {
        findFirst: vi.fn().mockResolvedValue(account),
        update: vi.fn().mockResolvedValue(updatedAccount),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-id" }),
      },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(tx as unknown as Parameters<typeof callback>[0])
    );

    await accountReceivableRepo.update(ACCOUNT_ID, {
      description: "Cliente alterado",
      userId: USER_ID,
    });

    expect(tx.accountReceivable.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { description: "Cliente alterado" },
      })
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          action: "UPDATED",
          entity: "AccountReceivable",
          entityId: ACCOUNT_ID,
          metadata: expect.objectContaining({
            changed_fields: {
              description: {
                from: account.description,
                to: "Cliente alterado",
              },
            },
            fields: ["description"],
          }),
        }),
      })
    );
  });
});
