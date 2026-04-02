import { Page, Locator, expect } from "@playwright/test";

export class EmployeesPage {
  readonly page:          Page;
  readonly searchInput:   Locator;
  readonly addButton:     Locator;
  readonly employeeList:  Locator;
  readonly detailPanel:   Locator;

  constructor(page: Page) {
    this.page         = page;
    this.searchInput  = page.getByPlaceholder(/Name.*suchen/);
    this.addButton    = page.getByRole("button", { name: /Mitarbeiter/ });
    this.employeeList = page.getByTestId("employee-list");
    this.detailPanel  = page.getByTestId("employee-detail");
  }

  async goto() {
    await this.page.getByRole("button", { name: "Mitarbeiter" }).click();
    await expect(this.employeeList).toBeVisible();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // Debounce
  }

  async selectEmployee(name: string) {
    await this.employeeList
      .getByText(name)
      .first()
      .click();
    await expect(this.detailPanel).toBeVisible();
  }

  async openAddForm() {
    await this.addButton.click();
    await expect(this.page.getByRole("dialog")).toBeVisible();
  }

  async fillEmployeeForm(data: {
    employeeNumber: string;
    firstName:      string;
    lastName:       string;
    email:          string;
    hireDate:       string;
    position?:      string;
    department?:    string;
    salary?:        string;
  }) {
    const dialog = this.page.getByRole("dialog");
    await dialog.getByLabel("Mitarbeiter-Nr.").fill(data.employeeNumber);
    await dialog.getByLabel("Vorname").fill(data.firstName);
    await dialog.getByLabel("Nachname").fill(data.lastName);
    await dialog.getByLabel("E-Mail").fill(data.email);
    await dialog.getByLabel("Einstellungsdatum").fill(data.hireDate);
    if (data.position)   await dialog.getByLabel("Position").fill(data.position);
    if (data.department) await dialog.getByLabel("Abteilung").selectOption(data.department);
    if (data.salary)     await dialog.getByLabel(/Gehalt/).fill(data.salary);
  }

  async saveForm() {
    await this.page.getByRole("button", { name: "Speichern" }).click();
  }

  async expectEmployeeInList(name: string) {
    await expect(this.employeeList.getByText(name)).toBeVisible();
  }

  async expectEmployeeDetail(data: Partial<{
    name:       string;
    position:   string;
    department: string;
    email:      string;
  }>) {
    if (data.name)       await expect(this.detailPanel.getByText(data.name)).toBeVisible();
    if (data.position)   await expect(this.detailPanel.getByText(data.position)).toBeVisible();
    if (data.department) await expect(this.detailPanel.getByText(data.department)).toBeVisible();
    if (data.email)      await expect(this.detailPanel.getByText(data.email)).toBeVisible();
  }
}
