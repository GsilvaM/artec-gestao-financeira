// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../lib/prisma/client.js";
import { accountPayableRepo } from "../server/financeiro/repositories.js";
import { payAccountPayable } from "../server/financeiro/accounts-payable-service.js";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("accounts payable beneficiary integration", () => {
  it("creates account with supplier (legacy) and backfills beneficiary fields", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "despesa", deletedAt: null },
    });

    const account = await accountPayableRepo.create({
      description: "Teste Fornecedor Legado",
      amount: 1500,
      dueDate: new Date("2026-08-01"),
      categoryId: category.id,
      supplier: "Fornecedor XPTO",
      userId: "00000000-0000-0000-0000-000000000000",
    });

    expect(account.beneficiaryType).toBe("supplier");
    expect(account.beneficiaryId).toBeNull();
    expect(account.beneficiaryName).toBe("Fornecedor XPTO");
    expect(account.supplier).toBe("Fornecedor XPTO");

    await prisma.accountPayable.delete({ where: { id: account.id } });
  });

  it("creates account with collaborator beneficiary", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "despesa", deletedAt: null },
    });

    const collaborator = await prisma.collaborator.create({
      data: { name: "Maria Teste", email: "maria@teste.com", active: true },
    });

    const account = await accountPayableRepo.create({
      description: "Salario Maria",
      amount: 5000,
      dueDate: new Date("2026-08-05"),
      categoryId: category.id,
      beneficiaryType: "collaborator",
      beneficiaryId: collaborator.id,
      beneficiaryName: collaborator.name,
      userId: "00000000-0000-0000-0000-000000000000",
    });

    expect(account.beneficiaryType).toBe("collaborator");
    expect(account.beneficiaryId).toBe(collaborator.id);
    expect(account.beneficiaryName).toBe("Maria Teste");
    expect(account.supplier).toBeNull();

    await prisma.accountPayable.delete({ where: { id: account.id } });
    await prisma.collaborator.delete({ where: { id: collaborator.id } });
  });

  it("rejects inactive collaborator", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "despesa", deletedAt: null },
    });

    const collaborator = await prisma.collaborator.create({
      data: { name: "Inativo Teste", email: "inativo@teste.com", active: false },
    });

    await expect(
      accountPayableRepo.create({
        description: "Conta Inválida",
        amount: 1000,
        dueDate: new Date("2026-08-10"),
        categoryId: category.id,
        beneficiaryType: "collaborator",
        beneficiaryId: collaborator.id,
        userId: "00000000-0000-0000-0000-000000000000",
      })
    ).rejects.toThrow("Selecione um colaborador ativo");

    await prisma.collaborator.delete({ where: { id: collaborator.id } });
  });

  it("pays a collaborator account and creates financial entry with collaboratorId", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "despesa", deletedAt: null },
    });

    const collaborator = await prisma.collaborator.create({
      data: { name: "João Pagamento", email: "joao@teste.com", active: true },
    });

    const account = await accountPayableRepo.create({
      description: "Pro-labore João",
      amount: 8000,
      dueDate: new Date("2026-08-15"),
      categoryId: category.id,
      beneficiaryType: "collaborator",
      beneficiaryId: collaborator.id,
      beneficiaryName: collaborator.name,
      userId: "00000000-0000-0000-0000-000000000000",
    });

    const result = await payAccountPayable(account.id, {
      paymentDate: new Date("2026-08-01"),
      paidAmount: 8000,
      paymentMethod: "pix",
      userId: "00000000-0000-0000-0000-000000000000",
    });

    expect(result.account.status).toBe("paid");
    expect(result.financialEntry.collaboratorId).toBe(collaborator.id);
    expect(result.financialEntry.clientName).toBe("João Pagamento");
    expect(result.financialEntry.type).toBe("despesa");
    expect(result.financialEntry.status).toBe("confirmed");

    await prisma.financialEntry.delete({ where: { id: result.financialEntry.id } });
    await prisma.accountPayable.delete({ where: { id: account.id } });
    await prisma.collaborator.delete({ where: { id: collaborator.id } });
  });

  it("updates beneficiary from supplier to collaborator", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "despesa", deletedAt: null },
    });

    const collaborator = await prisma.collaborator.create({
      data: { name: "Carlos Atualizado", email: "carlos@teste.com", active: true },
    });

    const account = await accountPayableRepo.create({
      description: "Servico Fornecedor",
      amount: 2000,
      dueDate: new Date("2026-09-01"),
      categoryId: category.id,
      supplier: "Fornecedor Antigo",
      userId: "00000000-0000-0000-0000-000000000000",
    });

    expect(account.beneficiaryType).toBe("supplier");

    const updated = await accountPayableRepo.update(account.id, {
      beneficiaryType: "collaborator",
      beneficiaryId: collaborator.id,
      userId: "00000000-0000-0000-0000-000000000000",
    });

    expect(updated.beneficiaryType).toBe("collaborator");
    expect(updated.beneficiaryId).toBe(collaborator.id);
    expect(updated.beneficiaryName).toBe("Carlos Atualizado");
    expect(updated.supplier).toBeNull();

    await prisma.accountPayable.delete({ where: { id: account.id } });
    await prisma.collaborator.delete({ where: { id: collaborator.id } });
  });

  it("filters accounts by beneficiaryType", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "despesa", deletedAt: null },
    });

    const account1 = await accountPayableRepo.create({
      description: "Filtro Fornecedor",
      amount: 100,
      dueDate: new Date("2026-10-01"),
      categoryId: category.id,
      supplier: "Filtrado Ltda",
      userId: "00000000-0000-0000-0000-000000000000",
    });

    const filterCollab = await prisma.collaborator.create({
      data: { name: "Filtrado Colab", email: "filtro@teste.com", active: true },
    });

    const account2 = await accountPayableRepo.create({
      description: "Filtro Colaborador",
      amount: 200,
      dueDate: new Date("2026-10-01"),
      categoryId: category.id,
      beneficiaryType: "collaborator",
      beneficiaryId: filterCollab.id,
      beneficiaryName: filterCollab.name,
      userId: "00000000-0000-0000-0000-000000000000",
    });

    const suppliers = await accountPayableRepo.findAll({
      beneficiaryType: "supplier",
    });
    expect(suppliers.some((a) => a.id === account1.id)).toBe(true);
    expect(suppliers.some((a) => a.id === account2.id)).toBe(false);

    const collaborators = await accountPayableRepo.findAll({
      beneficiaryType: "collaborator",
    });
    expect(collaborators.some((a) => a.id === account2.id)).toBe(true);
    expect(collaborators.some((a) => a.id === account1.id)).toBe(false);

    await prisma.accountPayable.delete({ where: { id: account1.id } });
    await prisma.accountPayable.delete({ where: { id: account2.id } });
    await prisma.collaborator.delete({ where: { id: filterCollab.id } });
  });
});
