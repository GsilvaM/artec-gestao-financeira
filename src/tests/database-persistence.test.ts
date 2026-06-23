// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../lib/prisma/client.js";
import { financialEntryRepo } from "../server/financeiro/repositories.js";
import { getDre } from "../server/financeiro/queries.js";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("database persistence", () => {
  it("connects to the database and returns categories", async () => {
    const count = await prisma.category.count();
    expect(typeof count).toBe("number");
  });

  it("creates, reads, updates, and soft-deletes a category", async () => {
    const created = await prisma.category.create({
      data: { name: "Teste Persistência", type: "despesa", color: "#ff0000" },
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Teste Persistência");
    expect(created.type).toBe("despesa");
    expect(created.color).toBe("#ff0000");
    expect(created.deletedAt).toBeNull();

    const found = await prisma.category.findUniqueOrThrow({ where: { id: created.id } });
    expect(found.name).toBe("Teste Persistência");

    const updated = await prisma.category.update({
      where: { id: created.id },
      data: { name: "Teste Persistência Editado" },
    });
    expect(updated.name).toBe("Teste Persistência Editado");

    await prisma.category.update({
      where: { id: created.id },
      data: { deletedAt: new Date() },
    });

    const deleted = await prisma.category.findFirst({
      where: { id: created.id, deletedAt: null },
    });
    expect(deleted).toBeNull();

    await prisma.category.delete({ where: { id: created.id } });
  });

  it("creates and reads a financial entry", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "despesa", deletedAt: null },
    });

    const entry = await prisma.financialEntry.create({
      data: {
        description: "Teste Lançamento Persistência",
        amount: 1500.5,
        type: "despesa",
        date: new Date(),
        status: "confirmed",
        categoryId: category.id,
        userId: "00000000-0000-0000-0000-000000000000",
      },
    });

    expect(entry.id).toBeDefined();
    expect(Number(entry.amount)).toBe(1500.5);
    expect(entry.description).toBe("Teste Lançamento Persistência");

    const found = await prisma.financialEntry.findFirstOrThrow({
      where: { id: entry.id },
      include: { category: true },
    });
    expect(found.category.name).toBe(category.name);

    await prisma.financialEntry.delete({ where: { id: entry.id } });
  });

  it("creates and reads an account payable", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "despesa", deletedAt: null },
    });

    const account = await prisma.accountPayable.create({
      data: {
        description: "Teste Conta a Pagar",
        amount: 3200.0,
        dueDate: new Date("2026-07-15"),
        status: "pending",
        categoryId: category.id,
        supplier: "Fornecedor Teste",
        userId: "00000000-0000-0000-0000-000000000000",
      },
    });

    expect(account.id).toBeDefined();
    expect(Number(account.amount)).toBe(3200.0);
    expect(account.supplier).toBe("Fornecedor Teste");

    await prisma.accountPayable.delete({ where: { id: account.id } });
  });

  it("creates and reads a cost center", async () => {
    const cc = await prisma.costCenter.create({
      data: { name: "Centro de Teste", code: "CT-001", active: true },
    });

    expect(cc.id).toBeDefined();
    expect(cc.name).toBe("Centro de Teste");
    expect(cc.code).toBe("CT-001");
    expect(cc.active).toBe(true);

    await prisma.costCenter.delete({ where: { id: cc.id } });
  });

  it("performs a raw SQL query (DRE)", async () => {
    const rows = await prisma.$queryRaw<Array<{ result: number }>>`
      SELECT 1 AS result
    `;
    expect(rows[0]?.result).toBe(1);
  });

  it("performs financial entry CRUD and updates DRE aggregation", async () => {
    const category = await prisma.category.create({
      data: { name: "Teste Integração Receita", type: "receita", color: "#10B981" },
    });

    const created = await financialEntryRepo.create({
      description: "Teste integração lançamento",
      amount: 1000,
      type: "receita",
      date: new Date("2026-06-15T00:00:00.000Z"),
      status: "confirmed",
      categoryId: category.id,
      userId: "00000000-0000-0000-0000-000000000000",
    });

    expect(Number(created.amount)).toBe(1000);

    const updated = await financialEntryRepo.update(created.id, { amount: 1660 });
    expect(Number(updated.amount)).toBe(1660);

    const dre = await getDre(2026);
    expect(dre.summary.totalReceitas).toBeGreaterThanOrEqual(1660);
    expect(dre.rows.some((row) => row.type === "receita" && row.total >= 1660)).toBe(true);

    await financialEntryRepo.softDelete(created.id);
    const deleted = await prisma.financialEntry.findFirst({ where: { id: created.id, deletedAt: null } });
    expect(deleted).toBeNull();

    await prisma.financialEntry.delete({ where: { id: created.id } });
    await prisma.category.delete({ where: { id: category.id } });
  });
});
