// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../lib/prisma/client.js";
import { accountPayableRepo } from "../server/financeiro/repositories.js";
import { payAccountPayable } from "../server/financeiro/accounts-payable-service.js";

const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";

function asRecord(value: unknown) {
  return value as Record<string, unknown>;
}

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

  it("rejects nonexistent collaborator with 422", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "despesa", deletedAt: null },
    });

    await expect(
      accountPayableRepo.create({
        description: "Conta Colaborador Inexistente",
        amount: 1000,
        dueDate: new Date("2026-08-11"),
        categoryId: category.id,
        beneficiaryType: "collaborator",
        beneficiaryId: "00000000-0000-0000-0000-000000000999",
        userId: TEST_USER_ID,
      })
    ).rejects.toMatchObject({
      message: "Selecione um colaborador ativo para a conta a pagar.",
      status: 422,
    });
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

  it("writes BENEFICIARY_CHANGED audit from supplier to collaborator", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "despesa", deletedAt: null },
    });

    const collaborator = await prisma.collaborator.create({
      data: {
        name: "Auditoria Colab",
        email: `auditoria-colab-${Date.now()}@teste.com`,
        active: true,
      },
    });

    const account = await accountPayableRepo.create({
      description: "Auditoria Fornecedor",
      amount: 2100,
      dueDate: new Date("2026-09-02"),
      categoryId: category.id,
      supplier: "Fornecedor Auditado",
      userId: TEST_USER_ID,
    });

    await accountPayableRepo.update(account.id, {
      beneficiaryType: "collaborator",
      beneficiaryId: collaborator.id,
      userId: TEST_USER_ID,
    });

    const audit = await prisma.auditLog.findFirstOrThrow({
      where: {
        entity: "AccountPayable",
        entityId: account.id,
        action: "BENEFICIARY_CHANGED",
      },
      orderBy: { createdAt: "desc" },
    });
    const metadata = asRecord(audit.metadata);
    const changedFields = asRecord(metadata.changed_fields);
    const beneficiaryType = asRecord(changedFields.beneficiaryType);
    const beneficiaryId = asRecord(changedFields.beneficiaryId);

    expect(metadata.action).toBe("BENEFICIARY_CHANGED");
    expect(metadata.entity_type).toBe("AccountPayable");
    expect(beneficiaryType).toMatchObject({
      from: "supplier",
      to: "collaborator",
    });
    expect(beneficiaryId).toMatchObject({
      from: null,
      to: collaborator.id,
    });

    await prisma.auditLog.deleteMany({ where: { entityId: account.id } });
    await prisma.accountPayable.delete({ where: { id: account.id } });
    await prisma.collaborator.delete({ where: { id: collaborator.id } });
  });

  it("writes BENEFICIARY_CHANGED audit from collaborator to supplier", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "despesa", deletedAt: null },
    });

    const collaborator = await prisma.collaborator.create({
      data: {
        name: "Auditoria Volta",
        email: `auditoria-volta-${Date.now()}@teste.com`,
        active: true,
      },
    });

    const account = await accountPayableRepo.create({
      description: "Auditoria Colaborador",
      amount: 2200,
      dueDate: new Date("2026-09-03"),
      categoryId: category.id,
      beneficiaryType: "collaborator",
      beneficiaryId: collaborator.id,
      beneficiaryName: collaborator.name,
      userId: TEST_USER_ID,
    });

    await accountPayableRepo.update(account.id, {
      beneficiaryType: "supplier",
      beneficiaryId: null,
      supplier: "Fornecedor Novo",
      userId: TEST_USER_ID,
    });

    const audit = await prisma.auditLog.findFirstOrThrow({
      where: {
        entity: "AccountPayable",
        entityId: account.id,
        action: "BENEFICIARY_CHANGED",
      },
      orderBy: { createdAt: "desc" },
    });
    const metadata = asRecord(audit.metadata);
    const changedFields = asRecord(metadata.changed_fields);
    const beneficiaryType = asRecord(changedFields.beneficiaryType);
    const beneficiaryId = asRecord(changedFields.beneficiaryId);

    expect(metadata.action).toBe("BENEFICIARY_CHANGED");
    expect(beneficiaryType).toMatchObject({
      from: "collaborator",
      to: "supplier",
    });
    expect(beneficiaryId).toMatchObject({
      from: collaborator.id,
      to: null,
    });

    await prisma.auditLog.deleteMany({ where: { entityId: account.id } });
    await prisma.accountPayable.delete({ where: { id: account.id } });
    await prisma.collaborator.delete({ where: { id: collaborator.id } });
  });

  it("rejects stale updatedAt with 409 optimistic lock", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { type: "despesa", deletedAt: null },
    });

    const account = await accountPayableRepo.create({
      description: "Conta Concorrente",
      amount: 2300,
      dueDate: new Date("2026-09-04"),
      categoryId: category.id,
      supplier: "Fornecedor Concorrente",
      userId: TEST_USER_ID,
    });
    const expectedUpdatedAt = account.updatedAt;

    await accountPayableRepo.update(account.id, {
      description: "Conta Concorrente Atualizada",
      expectedUpdatedAt,
      userId: TEST_USER_ID,
    });

    await expect(
      accountPayableRepo.update(account.id, {
        notes: "Atualizacao obsoleta",
        expectedUpdatedAt,
        userId: TEST_USER_ID,
      })
    ).rejects.toMatchObject({
      message:
        "Conta a pagar foi alterada por outro usuario. Recarregue os dados antes de salvar.",
      status: 409,
    });

    await prisma.auditLog.deleteMany({ where: { entityId: account.id } });
    await prisma.accountPayable.delete({ where: { id: account.id } });
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
