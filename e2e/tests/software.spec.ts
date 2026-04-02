import { test, expect } from "@playwright/test";

test.describe("Software & Lizenzen", () => {

  test("Software-Liste wird angezeigt", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Software/ }).click();

    const cards = page.getByTestId("software-card");
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("Lizenzauslastung wird als Fortschrittsbalken angezeigt", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Software/ }).click();

    await expect(page.getByTestId("license-progress").first()).toBeVisible();
  });

  test("Warnung bei hoher Lizenzauslastung (>=85%)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Software/ }).click();

    // Warnsymbol bei kritischer Auslastung
    await expect(page.getByText("⚠️").first()).toBeVisible();
  });

  test("Lizenz einem Mitarbeiter zuweisen", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Software/ }).click();

    // Ersten Zuweisen-Button klicken
    await page.getByRole("button", { name: "Zuweisen" }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("Mitarbeiter").selectOption({ index: 1 });
    await dialog.getByRole("button", { name: "Zuweisen" }).click();

    await expect(page.getByText("zugewiesen")).toBeVisible();
  });

  test("Ablaufdatum nahe zeigt Warnung an", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Software/ }).click();

    // Ablaufwarnungen vorhanden
    await expect(page.getByTestId("renewal-warning").first()).toBeVisible();
  });
});
