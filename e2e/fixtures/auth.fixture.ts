import { test as base, Page } from "@playwright/test";

export type AuthFixture = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/login");
    await page.getByLabel("E-Mail").fill("admin@firma.de");
    await page.getByLabel("Passwort").fill("admin123");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/.*dashboard/);
    await use(page);
  },
});

export { expect } from "@playwright/test";
