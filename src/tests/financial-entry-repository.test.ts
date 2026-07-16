import { beforeEach, describe, expect, it, vi } from "vitest";
import { financialEntryRepo } from "@/server/financeiro/repositories";
import { prisma } from "@/lib/prisma/client.js";

vi.mock("@/lib/prisma/client.js", () => ({
  prisma: {
    financialEntry: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

describe("financialEntryRepo.findPage", () => {
  beforeEach(() => {
    vi.mocked(prisma.financialEntry.findMany).mockResolvedValue([]);
    vi.mocked(prisma.financialEntry.count).mockResolvedValue(0);
    vi.mocked(prisma.financialEntry.groupBy).mockResolvedValue([]);
  });

  it("summarizes only confirmed entries when no status filter is provided", async () => {
    await financialEntryRepo.findPage(undefined, 1, 20);

    expect(prisma.financialEntry.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          status: "confirmed",
        }),
      }),
    );
  });

  it("respects an explicit status filter in the summary", async () => {
    await financialEntryRepo.findPage({ status: "pending" }, 1, 20);

    expect(prisma.financialEntry.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          status: "pending",
        }),
      }),
    );
  });
});
