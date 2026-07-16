import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProjectedCashFlow } from "@/server/financeiro/queries";
import { prisma } from "@/lib/prisma/client.js";

vi.mock("@/lib/prisma/client.js", () => ({
  prisma: {
    financialEntry: {
      aggregate: vi.fn(),
    },
    accountReceivable: {
      findMany: vi.fn(),
    },
    accountPayable: {
      findMany: vi.fn(),
    },
  },
}));

describe("getProjectedCashFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.accountReceivable.findMany).mockResolvedValue([]);
    vi.mocked(prisma.accountPayable.findMany).mockResolvedValue([]);
  });

  it("applies category and bank filters to the confirmed initial balance", async () => {
    vi.mocked(prisma.financialEntry.aggregate)
      .mockResolvedValueOnce({ _sum: { amount: 1000 } } as never)
      .mockResolvedValueOnce({ _sum: { amount: 350 } } as never);

    const result = await getProjectedCashFlow({
      dateFrom: new Date("2026-07-16T00:00:00"),
      dateTo: new Date("2026-07-20T23:59:59"),
      granularity: "day",
      categoryId: "00000000-0000-0000-0000-000000000001",
      bank: "Sicoob",
    });

    expect(prisma.financialEntry.aggregate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          type: "receita",
          status: "confirmed",
          categoryId: "00000000-0000-0000-0000-000000000001",
          OR: expect.arrayContaining([
            { bankAccount: { contains: "Sicoob", mode: "insensitive" } },
            { notes: { contains: "Sicoob", mode: "insensitive" } },
          ]),
        }),
      })
    );
    expect(prisma.financialEntry.aggregate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          type: "despesa",
          categoryId: "00000000-0000-0000-0000-000000000001",
          OR: expect.arrayContaining([
            { bankAccount: { contains: "Sicoob", mode: "insensitive" } },
            { notes: { contains: "Sicoob", mode: "insensitive" } },
          ]),
        }),
      })
    );
    expect(result.summary.currentBalance).toBe(650);
  });

  it("keeps the initial balance consolidated when bank is all", async () => {
    vi.mocked(prisma.financialEntry.aggregate)
      .mockResolvedValueOnce({ _sum: { amount: 800 } } as never)
      .mockResolvedValueOnce({ _sum: { amount: 200 } } as never);

    await getProjectedCashFlow({
      dateFrom: new Date("2026-07-16T00:00:00"),
      dateTo: new Date("2026-07-20T23:59:59"),
      granularity: "day",
      bank: "all",
    });

    expect(prisma.financialEntry.aggregate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.not.objectContaining({
          notes: expect.anything(),
        }),
      })
    );
  });
});
