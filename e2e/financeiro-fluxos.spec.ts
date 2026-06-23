import { expect, test } from "@playwright/test";

test.describe("Fluxos financeiros", () => {
  const receitaDescricao = `[E2E] Receita ${Date.now()}`;
  const despesaDescricao = `[E2E] Despesa ${Date.now()}`;
  const receitaEditada = `${receitaDescricao} editada`;

  test.beforeEach(async ({ page }) => {
    await page.goto("/app/financeiro/lancamentos");
    await expect(page.getByRole("heading", { name: "Lançamentos" })).toBeVisible();
  });

  test("cria receita, cria despesa, edita, exclui e valida dashboard/logout", async ({ page }) => {
    await createEntry(page, {
      description: receitaDescricao,
      type: "receita",
      category: "Venda de Serviços",
      amount: "1000",
      status: "pago",
    });
    await expect(page.getByText(receitaDescricao)).toBeVisible();
    await expect(page.getByRole("table").getByText(/R\$\s*1\.000,00/)).toBeVisible();

    await createEntry(page, {
      description: despesaDescricao,
      type: "despesa",
      category: "Material",
      amount: "660",
      status: "aberto",
    });
    await expect(page.getByText(despesaDescricao)).toBeVisible();
    await expect(page.getByRole("table").getByText(/R\$\s*660,00/)).toBeVisible();
    await expect(page.getByText(/R\$\s*340,00/)).toBeVisible();

    await editFirstEntry(page, receitaDescricao, receitaEditada, "1660");
    await expect(page.getByText(receitaEditada)).toBeVisible();
    await expect(page.getByRole("table").getByText(/R\$\s*1\.660,00/)).toBeVisible();
    await expect(page.getByText(/R\$\s*1\.000,00/).first()).toBeVisible();

    await deleteEntry(page, despesaDescricao);
    await expect(page.getByText(despesaDescricao)).toHaveCount(0);
    await expect(page.getByRole("table").getByText(/R\$\s*1\.660,00/)).toBeVisible();

    await page.goto("/app");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText(/R\$\s*1\.660,00/).first()).toBeVisible();

    await page.getByRole("button", { name: /menu do usuário/i }).click();
    await page.getByRole("banner").getByRole("button", { name: /^sair$/i }).click();
    await expect(page.getByRole("heading", { name: "Artec Gestão" })).toBeVisible();
  });

  test("aplica filtros visuais sem quebrar tabela", async ({ page }) => {
    await page.getByPlaceholder(/buscar por descrição/i).fill("receita");
    await expect(page.locator("table")).toBeVisible();
  });
});

async function createEntry(
  page: import("@playwright/test").Page,
  entry: { description: string; type: "receita" | "despesa"; category: string; amount: string; status: "aberto" | "pago" | "vencido" },
) {
  await page.getByRole("button", { name: /novo lançamento/i }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /novo lançamento/i })).toBeVisible();
  await dialog.locator('input[type="date"]').fill("2026-06-23");
  await dialog.locator("select").nth(0).selectOption(entry.type);
  await expect(dialog.locator("select").nth(1).locator("option")).toContainText([entry.category]);
  await dialog.locator("select").nth(1).selectOption({ label: entry.category });
  await dialog.locator("select").nth(2).selectOption(entry.status);
  await dialog.getByPlaceholder("Descrição do lançamento").fill(entry.description);
  await dialog.getByPlaceholder("0,00").fill(entry.amount);
  await dialog.getByRole("button", { name: /salvar lançamento/i }).click();
  await expect(dialog).toHaveCount(0);
}

async function editFirstEntry(page: import("@playwright/test").Page, currentDescription: string, nextDescription: string, amount: string) {
  const row = page.getByRole("row").filter({ hasText: currentDescription });
  await row.getByRole("button", { name: /ações/i }).click();
  await page.getByRole("menuitem", { name: /editar/i }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Descrição do lançamento").fill(nextDescription);
  await dialog.getByPlaceholder("0,00").fill(amount);
  await dialog.getByRole("button", { name: /atualizar lançamento/i }).click();
  await expect(dialog).toHaveCount(0);
}

async function deleteEntry(page: import("@playwright/test").Page, description: string) {
  const row = page.getByRole("row").filter({ hasText: description });
  await row.getByRole("button", { name: /ações/i }).click();
  await page.getByRole("menuitem", { name: /excluir/i }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /^excluir$/i }).click();
  await expect(dialog).toHaveCount(0);
}
