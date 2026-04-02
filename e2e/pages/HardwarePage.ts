import { Page, Locator, expect } from "@playwright/test";

export class HardwarePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.getByRole("button", { name: "Hardware" }).click();
  }

  async filterByStatus(status: "AVAILABLE" | "LOANED" | "MAINTENANCE" | "RETIRED") {
    const labels: Record<string, string> = {
      AVAILABLE:   "Verfügbar",
      LOANED:      "Ausgeliehen",
      MAINTENANCE: "Wartung",
      RETIRED:     "Ausgemustert",
    };
    await this.page.getByRole("button", { name: labels[status] }).click();
  }

  async openLoanDialog(assetTag: string) {
    const row = this.page.getByText(assetTag).locator("..").locator("..");
    await row.getByRole("button", { name: /Ausleihen/ }).click();
    await expect(this.page.getByRole("dialog")).toBeVisible();
  }

  async loanHardware(assetTag: string, employeeName: string, returnDate?: string) {
    await this.openLoanDialog(assetTag);
    const dialog = this.page.getByRole("dialog");
    await dialog.getByLabel("Mitarbeiter").selectOption({ label: employeeName });
    if (returnDate) {
      await dialog.getByLabel("Rückgabedatum").fill(returnDate);
    }
    await dialog.getByRole("button", { name: /Ausleihen/ }).click();
  }

  async returnHardware(assetTag: string, notes?: string) {
    const row = this.page.getByText(assetTag).locator("..").locator("..");
    await row.getByRole("button", { name: /Rückgabe/ }).click();
    const dialog = this.page.getByRole("dialog");
    if (notes) await dialog.getByLabel("Zustandsnotiz").fill(notes);
    await dialog.getByRole("button", { name: /Zurückgeben/ }).click();
  }

  async expectHardwareStatus(assetTag: string, status: string) {
    const row = this.page.getByText(assetTag).locator("..").locator("..");
    await expect(row.getByText(status)).toBeVisible();
  }

  async expectToast(message: string) {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 5000 });
  }
}
