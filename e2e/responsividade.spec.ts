import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "notebook", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

async function expectNoGlobalHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    function hasHorizontalScrollContainer(element: Element) {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const overflowX = getComputedStyle(parent).overflowX;
        if (overflowX === "auto" || overflowX === "scroll") return true;
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
}
