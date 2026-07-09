import { expect, test } from "@playwright/test";

test.describe("Fluxos financeiros", () => {
  const receitaDescricao = `[E2E] Receita ${Date.now()}`;
  const despesaDescricao = `[E2E] Despesa ${Date.now()}`;
  const receitaEditada = `${receitaDescricao} editada`;

  test.beforeEach(async ({ page }) => {
    await page.goto("/app/financeiro/lancamentos");
    await expect(
      page.getByRole("heading", { name: /lan.*amentos/i }),
    ).toBeVisible();
  });

  test("cria receita, cria despesa, edita e exclui", async ({ page }) => {
    test.setTimeout(60_000);
    await createEntry(page, {
      description: receitaDescricao,
      type: "receita",
      category: "Venda de Servi",
      amount: "1000",
      status: "pago",
    });
    await searchEntry(page, receitaDescricao);
    await expect(page.getByText(receitaDescricao)).toBeVisible();
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: receitaDescricao })
        .getByText(/R\$\s*1\.000,00/),
    ).toBeVisible();

    await clearSearch(page);
    await createEntry(page, {
      description: despesaDescricao,
      type: "despesa",
      category: "Material",
      amount: "660",
      status: "aberto",
    });
    await searchEntry(page, despesaDescricao);
    await expect(page.getByText(despesaDescricao)).toBeVisible();
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: despesaDescricao })
        .getByText(/R\$\s*660,00/),
    ).toBeVisible();

    await searchEntry(page, receitaDescricao);
    await editFirstEntry(page, receitaDescricao, receitaEditada, "1660");
    await searchEntry(page, receitaEditada);
    await expect(page.getByText(receitaEditada)).toBeVisible();
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: receitaEditada })
        .getByText(/R\$\s*1\.660,00/),
    ).toBeVisible();

    await searchEntry(page, despesaDescricao);
    await deleteEntry(page, despesaDescricao);
    await expect(page.getByText(despesaDescricao)).toHaveCount(0);
    await searchEntry(page, receitaEditada);
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: receitaEditada })
        .getByText(/R\$\s*1\.660,00/),
    ).toBeVisible();
  });

  test("aplica filtros visuais sem quebrar tabela", async ({ page }) => {
    await page.getByRole("textbox", { name: /buscar/i }).fill("receita");
    await expect(page.locator("table")).toBeVisible();
  });
});

async function createEntry(
  page: import("@playwright/test").Page,
  entry: {
    description: string;
    type: "receita" | "despesa";
    category: string;
    amount: string;
    status: "aberto" | "pago" | "vencido";
  },
) {
  await page.getByRole("button", { name: /novo lan.*amento/i }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: /novo lan.*amento/i }),
  ).toBeVisible();
  await dialog.getByRole("textbox", { name: "Data" }).click();
  await dialog.getByRole("button", { name: /anterior/i }).click();
  await dialog.getByRole("button", { name: "23" }).click();
  await dialog.locator("select").nth(0).selectOption(entry.type);
  await selectOptionContaining(dialog.locator("select").nth(1), entry.category);
  await dialog.locator("select").nth(2).selectOption(entry.status);
  await dialog.getByPlaceholder(/descri.*o do lan.*amento/i).fill(entry.description);
  await dialog.getByPlaceholder("0,00").fill(entry.amount);
  await dialog.getByRole("button", { name: /salvar lan.*amento/i }).click();
  await expect(dialog).not.toBeVisible();
}

async function searchEntry(page: import("@playwright/test").Page, description: string) {
  await page.getByRole("textbox", { name: /buscar/i }).fill(description);
}

async function clearSearch(page: import("@playwright/test").Page) {
  await page.getByRole("textbox", { name: /buscar/i }).fill("");
}

async function editFirstEntry(
  page: import("@playwright/test").Page,
  currentDescription: string,
  nextDescription: string,
  amount: string,
) {
  const row = page.getByRole("row").filter({ hasText: currentDescription });
  await row.getByRole("button", { name: /a..es|acoes/i }).click();
  await page.getByRole("menuitem", { name: /editar/i }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder(/descri.*o do lan.*amento/i).fill(nextDescription);
  await dialog.getByPlaceholder("0,00").fill(amount);
  await dialog.getByRole("button", { name: /atualizar lan.*amento/i }).click();
  await expect(dialog).not.toBeVisible();
}

async function deleteEntry(page: import("@playwright/test").Page, description: string) {
  const row = page.getByRole("row").filter({ hasText: description });
  await row.getByRole("button", { name: /a..es|acoes/i }).click();
  await page.getByRole("menuitem", { name: /excluir/i }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /^excluir$/i }).click();
  await expect(dialog).not.toBeVisible();
}

async function selectOptionContaining(
  select: import("@playwright/test").Locator,
  text: string,
) {
  const getValue = () =>
    select.locator("option").evaluateAll((options, target) => {
      const normalizedTarget = String(target).toLowerCase();
      const option = options.find((item) =>
        item.textContent?.toLowerCase().includes(normalizedTarget),
      ) as HTMLOptionElement | undefined;
      return option?.value ?? "";
    }, text);

  await expect.poll(getValue, { timeout: 10_000 }).not.toBe("");
  const value = await getValue();
  await select.selectOption(value);
}
