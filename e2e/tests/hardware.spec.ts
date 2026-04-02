import { test, expect } from "@playwright/test";
import { HardwarePage } from "../pages/HardwarePage";

test.describe("Hardware-Verwaltung", () => {

  test("Hardware-Liste wird angezeigt", async ({ page }) => {
    const hwPage = new HardwarePage(page);
    await page.goto("/");
    await hwPage.goto();

    await expect(page.getByTestId("hardware-table")).toBeVisible();
    const rows = page.getByTestId("hardware-row");
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test("Filter 'Verfügbar' zeigt nur verfügbare Hardware", async ({ page }) => {
    const hwPage = new HardwarePage(page);
    await page.goto("/");
    await hwPage.goto();

    await hwPage.filterByStatus("AVAILABLE");

    const badges = page.getByText("Verfügbar");
    const rows   = page.getByTestId("hardware-row");
    // Jede Zeile zeigt "Verfügbar"
    await expect(badges).toHaveCount(await rows.count());
  });

  test("Verfügbare Hardware ausleihen", async ({ page }) => {
    const hwPage = new HardwarePage(page);
    await page.goto("/");
    await hwPage.goto();

    // Verfügbare Hardware filtern
    await hwPage.filterByStatus("AVAILABLE");

    // Erste verfügbare Hardware ausleihen
    await hwPage.loanHardware("HW-0001", "Maximilian Bauer");

    // Status hat sich geändert
    await hwPage.expectHardwareStatus("HW-0001", "Ausgeliehen");
    await hwPage.expectToast("ausgeliehen");
  });

  test("Ausgeliehene Hardware zurückgeben", async ({ page }) => {
    const hwPage = new HardwarePage(page);
    await page.goto("/");
    await hwPage.goto();

    await hwPage.filterByStatus("LOANED");
    await hwPage.returnHardware("HW-0002", "Gerät in einwandfreiem Zustand");

    await hwPage.expectHardwareStatus("HW-0002", "Verfügbar");
    await hwPage.expectToast("zurückgenommen");
  });

  test("Bereits ausgeliehene Hardware kann nicht erneut ausgeliehen werden", async ({ page }) => {
    const hwPage = new HardwarePage(page);
    await page.goto("/");
    await hwPage.goto();

    await hwPage.filterByStatus("LOANED");

    // Der "Ausleihen"-Button sollte bei LOANED-Hardware nicht sichtbar sein
    const row = page.getByText("HW-0002").locator("..").locator("..");
    await expect(row.getByRole("button", { name: /Ausleihen/ })).not.toBeVisible();
    await expect(row.getByRole("button", { name: /Rückgabe/ })).toBeVisible();
  });

  test("Garantie-Warnung bei abgelaufener Garantie", async ({ page }) => {
    const hwPage = new HardwarePage(page);
    await page.goto("/");
    await hwPage.goto();

    // Abgelaufene Garantie zeigt Warnsymbol
    await expect(page.getByText("⚠️").first()).toBeVisible();
  });

  test("Hardware-Suche filtert Tabelle", async ({ page }) => {
    const hwPage = new HardwarePage(page);
    await page.goto("/");
    await hwPage.goto();

    await page.getByPlaceholder(/Hardware suchen/).fill("MacBook");

    const rows = page.getByTestId("hardware-row");
    for (let i = 0; i < await rows.count(); i++) {
      await expect(rows.nth(i)).toContainText("MacBook");
    }
  });
});
