import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../.auth/user.json");

setup("Login-State speichern", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("E-Mail").fill("admin@firma.de");
  await page.getByLabel("Passwort").fill("admin123");
  await page.getByRole("button", { name: "Anmelden" }).click();

  // Warten bis Dashboard geladen
  await expect(page.getByText("Dashboard")).toBeVisible();

  // Auth-State für alle Tests speichern
  await page.context().storageState({ path: authFile });
});
