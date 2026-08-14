import { defineConfig, type PlaywrightTestConfig } from "@playwright/test"

/**
 * O app é servido em /colorir-game/ — esse basename está duplicado em
 * vite.config.ts e src/router.tsx. Sem ele toda navegação cai em 404.
 * Os specs usam caminhos relativos: page.goto("duck-nest").
 */
const BASE_URL = "http://localhost:5173/colorir-game/"

/**
 * Só Chromium: os helpers de gesto usam CDP (Input.dispatchTouchEvent,
 * Input.synthesizePinchGesture), que não existe em WebKit/Firefox.
 *
 * `isMobile: true` é o que faz o Chromium respeitar o <meta name="viewport">.
 * Sem isso o teste de pinch-zoom seria inútil — o viewport meta é ignorado.
 */
const CHROMIUM_TOUCH = {
  browserName: "chromium" as const,
  isMobile: true,
  hasTouch: true,
}

const config: PlaywrightTestConfig = {
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  // Deliberadamente 0: esta suíte existe para EXPOR bugs e flakiness,
  // não para mascará-los com retentativa.
  retries: 0,

  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 90_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "mobile",
      use: {
        ...CHROMIUM_TOUCH,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
      },
    },
    {
      name: "tablet",
      use: {
        ...CHROMIUM_TOUCH,
        viewport: { width: 820, height: 1180 },
        deviceScaleFactor: 2,
      },
    },
    {
      // Motor do Safari. O bug de zoom/scroll relatado pelo usuário é
      // provavelmente exclusivo do iOS (o Chromium respeita
      // `user-scalable=no`; o Safari iOS ignora desde o iOS 10).
      // Sem CDP aqui — os testes que dependem de gesto sintetizado se
      // auto-pulam neste project.
      name: "ios-safari",
      testMatch: /viewport-lock\.spec\.ts/,
      use: {
        browserName: "webkit" as const,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      // useSoundEffects aborta 7 dos 10 sons ANTES de criar o AudioContext
      // quando reduced-motion está ativo — caminho de código diferente.
      // Roda só o console-health para comparar com o modo normal.
      name: "mobile-reduced-motion",
      testMatch: /console-health\.spec\.ts/,
      use: {
        ...CHROMIUM_TOUCH,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        // reducedMotion não é opção direta do runner nesta versão —
        // vai via contextOptions para o browser.newContext().
        contextOptions: { reducedMotion: "reduce" },
      },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
}

export default defineConfig(config)
