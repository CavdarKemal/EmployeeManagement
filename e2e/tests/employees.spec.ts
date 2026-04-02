import { test, expect } from "@playwright/test";
import { EmployeesPage } from "../pages/EmployeesPage";

test.describe("Mitarbeiterverwaltung", () => {

  test("Mitarbeiterliste wird angezeigt", async ({ page }) => {
    const empPage = new EmployeesPage(page);
    await page.goto("/");
    await empPage.goto();

    await expect(page.getByTestId("employee-list")).toBeVisible();
    // Mindestens ein Mitarbeiter vorhanden
    const items = page.getByTestId("employee-list-item");
    await expect(items).toHaveCount(await items.count(), { timeout: 5000 });
    expect(await items.count()).toBeGreaterThan(0);
  });

  test("Mitarbeiter suchen filtert die Liste", async ({ page }) => {
    const empPage = new EmployeesPage(page);
    await page.goto("/");
    await empPage.goto();

    await empPage.search("Bauer");

    const items = page.getByTestId("employee-list-item");
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText("Bauer");
  });

  test("Suche ohne Treffer zeigt leere Liste", async ({ page }) => {
    const empPage = new EmployeesPage(page);
    await page.goto("/");
    await empPage.goto();

    await empPage.search("XxNichtVorhandenXx");
    await expect(page.getByText("Keine Mitarbeiter gefunden")).toBeVisible();
  });

  test("Mitarbeiter auswählen zeigt Detail-Panel", async ({ page }) => {
    const empPage = new EmployeesPage(page);
    await page.goto("/");
    await empPage.goto();

    await empPage.selectEmployee("Maximilian Bauer");

    await empPage.expectEmployeeDetail({
      name:       "Maximilian Bauer",
      position:   "Senior Developer",
      department: "Engineering",
    });
  });

  test("Neuer Mitarbeiter anlegen", async ({ page }) => {
    const empPage = new EmployeesPage(page);
    await page.goto("/");
    await empPage.goto();

    await empPage.openAddForm();
    await empPage.fillEmployeeForm({
      employeeNumber: "EMP-E2E-001",
      firstName:      "Test",
      lastName:       "Playwright",
      email:          `pw.test.${Date.now()}@firma.de`,
      hireDate:       "2024-06-01",
      position:       "QA Engineer",
      department:     "Engineering",
      salary:         "65000",
    });
    await empPage.saveForm();

    // Erfolgs-Toast erscheint
    await expect(page.getByText(/gespeichert/)).toBeVisible();
    // Mitarbeiter in Liste
    await empPage.expectEmployeeInList("Test Playwright");
  });

  test("Pflichtfeld-Validierung beim Anlegen", async ({ page }) => {
    const empPage = new EmployeesPage(page);
    await page.goto("/");
    await empPage.goto();

    await empPage.openAddForm();
    // Formular leer absenden
    await empPage.saveForm();

    // Fehler erscheinen
    await expect(page.getByText("Pflichtfeld").first()).toBeVisible();
  });

  test("Master-Detail Layout – beide Bereiche sichtbar", async ({ page }) => {
    const empPage = new EmployeesPage(page);
    await page.goto("/");
    await empPage.goto();

    await expect(page.getByTestId("employee-list")).toBeVisible();
    await expect(page.getByTestId("employee-detail")).toBeVisible();
  });

  test("Grid-Ansicht umschalten", async ({ page }) => {
    const empPage = new EmployeesPage(page);
    await page.goto("/");
    await empPage.goto();

    await page.getByTitle("Grid-Ansicht").click();
    await expect(page.getByTestId("employee-grid")).toBeVisible();

    // Zurück zu Liste
    await page.getByTitle("Listen-Ansicht").click();
    await expect(page.getByTestId("employee-list")).toBeVisible();
  });
});
