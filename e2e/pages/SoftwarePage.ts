import { Page, Locator, expect } from "@playwright/test";

export class SoftwarePage {
  readonly page: Page;
  readonly softwareCards: Locator;

  constructor(page: Page) {
    this.page         = page;
    this.softwareCards = page.getByTestId("software-card");
  }

  async goto() {
    await this.page.getByRole("button", { name: /Software/ }).click();
    await expect(this.softwareCards.first()).toBeVisible();
  }

  async assignLicense(employeeIndex: number = 1) {
    await this.page.getByRole("button", { name: "Zuweisen" }).first().click();
    const dialog = this.page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Mitarbeiter").selectOption({ index: employeeIndex });
    await dialog.getByRole("button", { name: "Zuweisen" }).click();
  }

  async expectLicenseProgress() {
    await expect(this.page.getByTestId("license-progress").first()).toBeVisible();
  }

  async expectRenewalWarning() {
    await expect(this.page.getByTestId("renewal-warning").first()).toBeVisible();
  }

  async expectAssignmentSuccess() {
    await expect(this.page.getByText("zugewiesen")).toBeVisible();
  }
}
