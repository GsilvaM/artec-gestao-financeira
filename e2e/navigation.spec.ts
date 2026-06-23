import { test, expect } from "@playwright/test";

test.describe("Sidebar navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app");
  });

  const links: { label: string; url: string }[] = [
    { label: "Dashboard", url: "/app" },
    { label: "Lançamentos", url: "/app/financeiro/lancamentos" },
    { label: "Contas a Pagar", url: "/app/financeiro/contas-pagar" },
    { label: "Contas a Receber", url: "/app/financeiro/contas-receber" },
    { label: "Categorias", url: "/app/financeiro/categorias" },
    { label: "Centros de Custo", url: "/app/financeiro/centros-custo" },
    { label: "DRE", url: "/app/financeiro/dre" },
    { label: "Fluxo de Caixa", url: "/app/financeiro/fluxo-caixa" },
    { label: "Serviços", url: "/app/operacional/servicos" },
    { label: "Cadastro", url: "/app/operacional/cadastro-servicos" },
    { label: "Técnicos", url: "/app/operacional/tecnicos" },
    { label: "Colaboradores", url: "/app/operacional/colaboradores" },
    { label: "Produtividade", url: "/app/operacional/produtividade" },
    { label: "Rentabilidade", url: "/app/operacional/rentabilidade" },
    { label: "Relatórios", url: "/app/relatorios" },
    { label: "Admin", url: "/app/admin" },
  ];

  for (const { label, url } of links) {
    test(`navigates to "${url}" when clicking "${label}"`, async ({
      page,
    }) => {
      await page.locator(`a[href="${url}"]`).first().click();
      await expect(page).toHaveURL(url);
    });
  }

  test("shows logged-in user email in sidebar footer", async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    if (email) {
      await expect(page.getByText(email)).toBeVisible();
    }
  });

  test("sign out button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /sair/i })).toBeVisible();
  });
});
