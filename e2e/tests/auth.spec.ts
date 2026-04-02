import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

// Auth-Tests laufen OHNE gespeicherten State
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentifizierung", () => {

  test("Login mit gültigen Zugangsdaten", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login("admin@firma.de", "admin123");
    await loginPage.expectRedirectToDashboard();

    // JWT im localStorage gespeichert
    const token = await page.evaluate(() => localStorage.getItem("jwt"));
    expect(token).toBeTruthy();
  });

  test("Login mit falschem Passwort zeigt Fehler", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login("admin@firma.de", "falsch");
    await loginPage.expectLoginError("Ungültige Zugangsdaten");
  });

  test("Login mit leerer E-Mail zeigt Validierungsfehler", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login("", "admin123");
    // HTML5-Validierung
    const emailInput = page.getByLabel("E-Mail");
    await expect(emailInput).toBeFocused();
  });

  test("Abmelden löscht Session", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("admin@firma.de", "admin123");
    await loginPage.expectRedirectToDashboard();

    // Abmelden
    await page.getByRole("button", { name: "Abmelden" }).click();

    // Zurück zum Login
    await expect(page).toHaveURL(/.*login/);
    const token = await page.evaluate(() => localStorage.getItem("jwt"));
    expect(token).toBeNull();
  });

  test("Geschützte Seite leitet zu Login weiter", async ({ page }) => {
    await page.goto("/employees");
    await expect(page).toHaveURL(/.*login/);
  });
});
