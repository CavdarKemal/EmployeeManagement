import { test as base } from "@playwright/test";

// Testdaten-Typen
export type Employee = {
  employeeNumber: string;
  firstName:      string;
  lastName:       string;
  email:          string;
  hireDate:       string;
  position:       string;
  department:     string;
};

// Fixture mit API-Calls zum Backend
export const test = base.extend<{
  testEmployee: Employee;
  cleanupEmployees: void;
}>({
  // Mitarbeiter vor dem Test anlegen, nach dem Test löschen
  testEmployee: async ({ request }, use) => {
    const employee: Employee = {
      employeeNumber: `EMP-TEST-${Date.now()}`,
      firstName:      "Playwright",
      lastName:       "Test",
      email:          `pw.${Date.now()}@test.de`,
      hireDate:       "2024-01-01",
      position:       "Tester",
      department:     "Engineering",
    };

    // Via API anlegen
    const response = await request.post("/api/v1/employees", {
      data: employee,
      headers: { Authorization: `Bearer ${process.env.TEST_JWT}` },
    });
    const created = await response.json();

    // Test ausführen
    await use({ ...employee, ...created });

    // Aufräumen
    await request.delete(`/api/v1/employees/${created.id}`, {
      headers: { Authorization: `Bearer ${process.env.TEST_JWT}` },
    });
  },
});

export { expect } from "@playwright/test";
