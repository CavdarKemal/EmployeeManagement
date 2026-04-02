import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page:          Page;
  readonly emailInput:    Locator;
  readonly passwordInput: Locator;
  readonly loginButton:   Locator;
  readonly errorMessage:  Locator;

  constructor(page: Page) {
    this.page          = page;
    this.emailInput    = page.getByLabel("E-Mail");
    this.passwordInput = page.getByLabel("Passwort");
    this.loginButton   = page.getByRole("button", { name: "Anmelden" });
    this.errorMessage  = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectLoginError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectRedirectToDashboard() {
    await expect(this.page).toHaveURL(/.*dashboard/);
    await expect(this.page.getByText("Dashboard")).toBeVisible();
  }
}
