import { expect, test, type Locator, type Page } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "notebook", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile compacto", width: 360, height: 640 },
  { name: "mobile médio", width: 390, height: 800 },
  { name: "mobile amplo", width: 412, height: 915 },
  { name: "mobile grande", width: 430, height: 932 },
  { name: "mobile largo", width: 480, height: 960 },
];

async function expectNoGlobalHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    function hasHorizontalScrollContainer(element: Element) {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const overflowX = getComputedStyle(parent).overflowX;
        if (overflowX === "auto" || overflowX === "scroll" || overflowX === "hidden" || overflowX === "clip") return true;
        parent = parent.parentElement;
      }
      return false;
    }

    const maxElementRight = Math.max(
      ...Array.from(document.querySelectorAll("body *"))
        .filter((element) => !hasHorizontalScrollContainer(element))
        .map((element) => Math.ceil(element.getBoundingClientRect().right)),
      0,
    );

    return {
      clientWidth: root.clientWidth,
      documentScrollWidth: root.scrollWidth,
      bodyScrollWidth: body.scrollWidth,
      maxElementRight,
    };
  });

  expect(overflow.documentScrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  expect(overflow.maxElementRight).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test("rotas-chave em dark mode sem overflow em mobile medio", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.addInitScript(() => {
    window.localStorage.setItem("artec.theme", "dark");
  });

  const routes = [
    ["dashboard", "/app"],
    ["lancamentos", "/app/financeiro/lancamentos"],
    ["fluxo-caixa", "/app/financeiro/fluxo-caixa"],
    ["dre", "/app/financeiro/dre"],
  ] as const;

  for (const [name, route] of routes) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("h1")).toBeVisible();
    await expectNoGlobalHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`${name}-dark-390x800.png`), fullPage: true });
  }
});

async function expectNoFixedActionOverlap(page: Page) {
  const overlaps = await page.evaluate(() => {
    const action = document.querySelector<HTMLElement>(".page-mobile-action");
    if (!action || getComputedStyle(action).display === "none") return [];
    const actionRect = action.getBoundingClientRect();
    return Array.from(document.querySelectorAll<HTMLElement>("button, a, [role='button']"))
      .filter((element) => !action.contains(element) && !element.closest(".mobile-bottom-nav") && !element.closest("dialog"))
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) return false;
        return rect.left < actionRect.right && rect.right > actionRect.left && rect.top < actionRect.bottom && rect.bottom > actionRect.top;
      })
      .map((element) => element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 80) || element.tagName);
  });

  expect(overlaps).toEqual([]);
}

async function expectButtonAligned(page: Page, selector: string) {
  const metrics = await page.locator(selector).evaluateAll((elements) => {
    const visible = elements.find((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    if (!visible) return null;
    const style = getComputedStyle(visible);
    const rect = visible.getBoundingClientRect();
    const svg = visible.querySelector("svg");
    const svgRect = svg?.getBoundingClientRect();
    return {
      display: style.display,
      alignItems: style.alignItems,
      justifyContent: style.justifyContent,
      lineHeight: style.lineHeight,
      height: Math.round(rect.height),
      svgHeight: svgRect ? Math.round(svgRect.height) : null,
      svgCenterDelta: svgRect ? Math.abs((svgRect.top + svgRect.height / 2) - (rect.top + rect.height / 2)) : 0,
    };
  });

  expect(metrics).not.toBeNull();
  if (!metrics) return;
  expect(["inline-flex", "flex"]).toContain(metrics.display);
  expect(metrics.alignItems).toBe("center");
  expect(metrics.justifyContent).toBe("center");
  expect(metrics.height).toBeGreaterThanOrEqual(36);
  if (metrics.svgHeight !== null) {
    expect(metrics.svgHeight).toBeGreaterThanOrEqual(14);
    expect(metrics.svgCenterDelta).toBeLessThanOrEqual(1);
  }
}

async function expectButtonLocatorAligned(locator: Locator) {
  await expect(locator).toBeVisible();
  const metrics = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const svg = element.querySelector("svg");
    const svgRect = svg?.getBoundingClientRect();
    return {
      display: style.display,
      alignItems: style.alignItems,
      justifyContent: style.justifyContent,
      height: Math.round(rect.height),
      svgHeight: svgRect ? Math.round(svgRect.height) : null,
      svgCenterDelta: svgRect ? Math.abs((svgRect.top + svgRect.height / 2) - (rect.top + rect.height / 2)) : 0,
    };
  });

  expect(["inline-flex", "flex"]).toContain(metrics.display);
  expect(metrics.alignItems).toBe("center");
  expect(metrics.justifyContent).toBe("center");
  expect(metrics.height).toBeGreaterThanOrEqual(36);
  if (metrics.svgHeight !== null) {
    expect(metrics.svgHeight).toBeGreaterThanOrEqual(14);
    expect(metrics.svgCenterDelta).toBeLessThanOrEqual(1);
  }
}

test("drawer mobile gerencia foco e fecha ao navegar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/app");

  await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  const drawer = page.locator("#menu-mobile");
  await expect(drawer).toBeVisible();
  await expect(drawer).toBeFocused();

  const lancamentosLink = drawer.locator('a[href="/app/financeiro/lancamentos"]').first();
  await expect(lancamentosLink).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/app\/financeiro\/lancamentos/),
    lancamentosLink.click(),
  ]);
  await expect(drawer).toHaveCount(0);
  await expectNoGlobalHorizontalOverflow(page);
});

test("botoes criticos mantem alinhamento computado", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 800 });

  await page.goto("/app/financeiro/lancamentos");
  await expect(page).toHaveURL(/\/app\/financeiro\/lancamentos/);
  await expect(page.getByRole("heading", { name: /Lan/ })).toBeVisible();
  await expectButtonLocatorAligned(page.getByRole("button", { name: /novo/i }).first());
  await expectButtonAligned(page, "button[aria-label='Abrir menu']");

  await page.goto("/app/financeiro/fluxo-caixa");
  await expect(page).toHaveURL(/\/app\/financeiro\/fluxo-caixa/);
  await expect(page.getByRole("heading", { name: "Fluxo de Caixa" })).toBeVisible();
  await expectButtonLocatorAligned(page.getByRole("button", { name: /a(c|ç)(o|õ)es/i }).first());
});

test("lancamentos mobile preserva valores, textos e paginacao compacta", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/app/financeiro/lancamentos");
  await expect(page.getByRole("heading", { name: /Lan/ })).toBeVisible();
  await expectNoGlobalHorizontalOverflow(page);

  const summaryValues = page.locator(".lancamentos-summary-grid .summary-card > div > p");
  const summaryCount = await summaryValues.count();
  expect(summaryCount).toBeGreaterThan(0);
  for (let index = 0; index < summaryCount; index += 1) {
    const box = await summaryValues.nth(index).boundingBox();
    const parentBox = await summaryValues.nth(index).locator("..").boundingBox();
    expect(box).not.toBeNull();
    expect(parentBox).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(parentBox!.x + parentBox!.width + 1);
  }

  const firstCard = page.locator(".transaction-mobile-card").first();
  if (await firstCard.count()) {
    await expect(firstCard.locator(".transaction-mobile-title")).toBeVisible();
    await expect(firstCard.locator(".transaction-mobile-meta")).toBeVisible();
    const titleMetrics = await firstCard.locator(".transaction-mobile-title").evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        height: element.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(style.lineHeight),
      };
    });
    expect(titleMetrics.height).toBeLessThanOrEqual(titleMetrics.lineHeight * 2 + 3);
  }

  const pagination = page.locator(".lancamentos-pagination");
  if (await pagination.count()) {
    const box = await pagination.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThanOrEqual(92);
  }

  const fab = page.locator(".mobile-fab");
  await expect(fab).toBeVisible();
  await expectButtonLocatorAligned(fab);
  const fabMetrics = await page.evaluate(() => {
    const fabElement = document.querySelector<HTMLElement>(".mobile-fab");
    const bottomNav = document.querySelector<HTMLElement>(".mobile-bottom-nav");
    const paginationElement = document.querySelector<HTMLElement>(".lancamentos-pagination");
    if (!fabElement || !bottomNav) return null;
    const fabRect = fabElement.getBoundingClientRect();
    const bottomRect = bottomNav.getBoundingClientRect();
    const paginationRect = paginationElement?.getBoundingClientRect();
    return {
      fabBottom: fabRect.bottom,
      navTop: bottomRect.top,
      overlapsPagination: paginationRect
        ? fabRect.left < paginationRect.right &&
          fabRect.right > paginationRect.left &&
          fabRect.top < paginationRect.bottom &&
          fabRect.bottom > paginationRect.top
        : false,
    };
  });
  expect(fabMetrics).not.toBeNull();
  expect(fabMetrics!.fabBottom).toBeLessThanOrEqual(fabMetrics!.navTop - 4);
  expect(fabMetrics!.overlapsPagination).toBe(false);
});

test("fluxo de caixa mobile diferencia dias sem movimento", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/app/financeiro/fluxo-caixa");
  await expect(page.getByRole("heading", { name: "Fluxo de Caixa" })).toBeVisible();
  await expectNoGlobalHorizontalOverflow(page);

  const emptyNotes = page.locator(".cashflow-empty-period-note");
  if (await emptyNotes.count()) {
    await expect(emptyNotes.first()).toContainText(/Sem movimentacao prevista/);
    await expect(page.locator(".cashflow-card-empty .cashflow-values")).toHaveCount(0);
  }
});

test("dashboard e relatorios mobile evitam duplicacao e vazio dominante", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });

  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Indicadores complementares")).toBeVisible();
  await expect(page.getByText("Faturamento", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Lucro", { exact: true })).toHaveCount(0);
  await expectNoGlobalHorizontalOverflow(page);

  await page.goto("/app/relatorios");
  await expect(page.getByRole("heading", { name: /Relat/ })).toBeVisible();
  await expect(page.getByText(/Atalhos/)).toBeVisible();
  await expect(page.locator(".report-shortcut-card")).toHaveCount(2);
  await expectNoGlobalHorizontalOverflow(page);
});

test.describe("login sem sessao", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("botao de login mantem alinhamento computado", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto("/");
    await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
    await expectButtonAligned(page, "button:has-text('Entrar')");
  });
});

for (const viewport of viewports) {
  test(`lançamentos sem overflow horizontal em ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/app/financeiro/lancamentos");
    await expect(page.getByRole("heading", { name: "Lançamentos" })).toBeVisible();
    await expectNoGlobalHorizontalOverflow(page);

    if (viewport.width >= 768) {
      await expect(page.locator("table")).toBeVisible();
    } else {
      await expect(page.locator("table")).toHaveCount(0);
    }
  });

  test(`modal responsivo em ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/app/financeiro/lancamentos");
    await page.getByRole("button", { name: /novo lançamento/i }).first().click();

    const box = await page.getByRole("dialog").boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.height).toBeLessThanOrEqual(viewport.height);
    await expectNoGlobalHorizontalOverflow(page);
  });

  test(`contas a pagar sem overflow e com favorecido utilizavel em ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/app/financeiro/contas-pagar");
    await expect(page.getByRole("heading", { name: "Contas a Pagar" })).toBeVisible();
    await expectNoGlobalHorizontalOverflow(page);

    if (viewport.width >= 1024) {
      await expect(page.locator("table")).toBeVisible();
    } else {
      await expect(page.locator(".mobile-list")).toBeVisible();
    }

    await page.getByRole("button", { name: /nova conta/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Tipo do favorecido").selectOption("collaborator");
    await dialog.getByPlaceholder("Digite para buscar um colaborador").fill("maria");
    await expect(dialog.getByText(/Digite para buscar|Nenhum colaborador|Não foi possível|Colaborador selecionado|Carregando/i)).toBeVisible();

    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.height).toBeLessThanOrEqual(viewport.height);
    await expectNoGlobalHorizontalOverflow(page);
  });
}

for (const viewport of viewports.filter(({ width }) => width < 768)) {
  test(`telas principais sem overflow ou sobreposição de CTA em ${viewport.name}`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const routes = [
      ["inicio", "/app"],
      ["lancamentos", "/app/financeiro/lancamentos"],
      ["contas-pagar", "/app/financeiro/contas-pagar"],
      ["contas-receber", "/app/financeiro/contas-receber"],
      ["fluxo-caixa", "/app/financeiro/fluxo-caixa"],
      ["dre", "/app/financeiro/dre"],
      ["categorias", "/app/financeiro/categorias"],
      ["centros-custo", "/app/financeiro/centros-custo"],
      ["clientes", "/app/cadastros/clientes"],
      ["fornecedores", "/app/cadastros/fornecedores"],
      ["colaboradores", "/app/cadastros/colaboradores"],
      ["relatorios", "/app/relatorios"],
      ["relatorios-financeiros", "/app/relatorios/financeiros"],
      ["relatorios-centros-custo", "/app/relatorios/centros-custo"],
      ["configuracoes", "/app/configuracoes"],
      ["admin", "/app/admin"],
    ] as const;

    for (const [name, route] of routes) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await expectNoGlobalHorizontalOverflow(page);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expectNoFixedActionOverlap(page);
      await page.screenshot({ path: testInfo.outputPath(`${name}-${viewport.width}x${viewport.height}.png`), fullPage: true });
    }

    await page.goto("/app/financeiro/fluxo-caixa");
    await expect(page.getByRole("heading", { name: "Fluxo de Caixa" })).toBeVisible();
    await expect(page.locator(".table-scroll")).toHaveCSS("overflow-x", "auto");
    await expect(page.getByText("projectedBalance", { exact: true })).toHaveCount(0);

    await page.goto("/app/financeiro/dre");
    await expect(page.getByRole("heading", { name: "DRE" })).toBeVisible();
    const groupLabel = page.locator(".dre-group-label").first();
    if (await groupLabel.count()) await expect(groupLabel).toHaveCSS("display", "block");
  });
}
