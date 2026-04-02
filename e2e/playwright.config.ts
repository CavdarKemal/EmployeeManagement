import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    ["html", { outputFolder: "e2e/report", open: "never" }],
    ["junit", { outputFile: "e2e/results.xml" }],
    ["list"],
  ],

  use: {
    baseURL:       process.env.BASE_URL ?? "http://localhost:3000",
    trace:         "on-first-retry",
    screenshot:    "only-on-failure",
    video:         "retain-on-failure",
    actionTimeout: 10_000,
  },

  projects: [
    // Setup: Login-State speichern
    {
      name: "setup",
      testMatch: "**/auth.setup.ts",
    },

    // Chromium mit gespeichertem Auth-State
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    // Firefox
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    // Mobile
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  // Lokalen Dev-Server starten falls nicht läuft
  webServer: {
    command: "npm run dev",
    url:     "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
