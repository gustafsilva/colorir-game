import { test, expect } from "./helpers/fixtures"
import { doubleTap, pinch, touchSwipe } from "./helpers/drag"
import {
  findScrollableElements,
  readLockStyles,
  readViewportState,
} from "./helpers/viewport"
import { ROUTES } from "./helpers/selectors"

/**
 * A tela tem que ser FIXA.
 *
 * O público é 2–5 anos: a criança apoia a mão na tela, encosta com dois
 * dedos, arrasta sem querer. Se a página dá zoom ou rola, o layout
 * desmonta e ela não sabe desfazer — não conhece "recarregar a página".
 *
 * O app tenta se defender, mas de forma incompleta:
 *  - index.html:6      → `user-scalable=no, maximum-scale=1` (Safari iOS IGNORA desde o iOS 10)
 *  - src/index.css:137 → `html { touch-action: manipulation }` (barra double-tap, NÃO barra pinch)
 *  - src/index.css:132 → `body { overflow: hidden }` (o `html` não tem — no iOS a raiz é quem rola)
 */

const CDP_ONLY = "gesto sintetizado depende de CDP (exclusivo do Chromium)"

test.describe("trava de viewport — zoom", () => {
  for (const route of ROUTES) {
    test(`${route.name}: pinça de dois dedos não pode dar zoom`, async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", CDP_ONLY)
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible()

      const before = await readViewportState(page)
      expect(before.scale, "a página já deveria começar em escala 1").toBe(1)

      await pinch(page, { x: before.innerWidth / 2, y: before.innerHeight / 2 }, 2.5)
      await page.waitForTimeout(400)

      const after = await readViewportState(page)
      expect(
        after.scale,
        `pinça deu zoom para ${after.scale}× — a criança não vai saber desfazer`,
      ).toBeCloseTo(1, 2)
    })

    test(`${route.name}: duplo toque não pode dar zoom`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible()

      const { innerWidth, innerHeight } = await readViewportState(page)
      await doubleTap(page, { x: innerWidth / 2, y: innerHeight / 2 })
      await page.waitForTimeout(400)

      const after = await readViewportState(page)
      expect(after.scale).toBeCloseTo(1, 2)
    })
  }
})

test.describe("trava de viewport — scroll", () => {
  for (const route of ROUTES) {
    test(`${route.name}: swipe vertical não pode rolar a página`, async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", CDP_ONLY)
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible()

      const { innerWidth, innerHeight } = await readViewportState(page)
      const cx = innerWidth / 2

      // Sobe (tentando revelar conteúdo abaixo) e desce (overscroll no topo).
      await touchSwipe(page, { x: cx, y: innerHeight * 0.8 }, { x: cx, y: innerHeight * 0.15 }, 12)
      await page.waitForTimeout(250)
      const afterUp = await readViewportState(page)

      await touchSwipe(page, { x: cx, y: innerHeight * 0.2 }, { x: cx, y: innerHeight * 0.85 }, 12)
      await page.waitForTimeout(250)
      const afterDown = await readViewportState(page)

      expect(afterUp.scrollY, "swipe para cima rolou a página").toBe(0)
      expect(afterUp.scrollTop, "swipe para cima rolou o elemento raiz").toBe(0)
      expect(afterDown.scrollY, "swipe para baixo rolou a página").toBe(0)
      expect(afterDown.offsetTop, "o visual viewport deslocou verticalmente").toBe(0)
    })

    test(`${route.name}: o layout cabe na tela sem gerar scroll`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible()
      // Deixa as animações de entrada assentarem antes de medir.
      await page.waitForTimeout(700)

      const s = await readViewportState(page)
      expect(
        s.scrollHeight,
        `conteúdo com ${s.scrollHeight}px de altura numa viewport de ${s.innerHeight}px`,
      ).toBeLessThanOrEqual(s.innerHeight + 1)
      expect(
        s.scrollWidth,
        `conteúdo com ${s.scrollWidth}px de largura numa viewport de ${s.innerWidth}px`,
      ).toBeLessThanOrEqual(s.innerWidth + 1)
    })
  }
})

test.describe("trava de viewport — roda/trackpad", () => {
  for (const route of ROUTES) {
    test(`${route.name}: roda do mouse não pode rolar a página`, async ({
      page,
      browserName,
    }) => {
      // Limitação da ferramenta, não do app: "Mouse wheel is not supported
      // in mobile WebKit".
      test.skip(browserName === "webkit", "roda do mouse não existe no WebKit mobile")
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible()
      await page.waitForTimeout(400)

      const before = await readViewportState(page)
      await page.mouse.move(200, 400)
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(300)
      const after = await readViewportState(page)

      if (after.scrollY !== 0 || after.scrollTop !== 0) {
        await test.info().attach("estado-do-scroll.json", {
          body: JSON.stringify({ before, after }, null, 2),
          contentType: "application/json",
        })
        await test.info().attach("apos-scroll.png", {
          body: await page.screenshot(),
          contentType: "image/png",
        })
      }

      expect(
        after.scrollY,
        `a página rolou ${after.scrollY}px (altura do conteúdo: ${after.scrollHeight}px, viewport: ${after.innerHeight}px)`,
      ).toBe(0)
      expect(after.scrollTop, "a roda rolou o elemento raiz").toBe(0)
    })
  }
})

test.describe("trava de viewport — diagnóstico", () => {
  test("inventário das regras globais de trava", async ({ page }) => {
    await page.goto("")
    const styles = await readLockStyles(page)
    await test.info().attach("regras-de-trava.json", {
      body: JSON.stringify(styles, null, 2),
      contentType: "application/json",
    })

    // Estas duas são o mínimo para o documento não rolar no iOS, onde
    // quem rola é o elemento raiz — `body { overflow: hidden }` sozinho
    // não segura.
    expect.soft(styles.htmlOverflow, "html precisa de overflow:hidden").toBe("hidden")
    expect
      .soft(styles.htmlOverscroll, "html precisa de overscroll-behavior:none")
      .toBe("none")
  })

  /**
   * Verificação ESTRUTURAL das defesas contra zoom.
   *
   * Não simula o iOS — simula não é possível aqui. Verifica se as defesas
   * que o iOS exige EXISTEM, despachando o evento e lendo defaultPrevented.
   *
   * Por que importa: o Chromium honra `user-scalable=no`, então os testes
   * de pinça acima passam. O Safari iOS ignora essa diretiva desde o iOS 10
   * — lá, a única defesa é interceptar os gestos em JS. Hoje não há
   * nenhum listener fazendo isso.
   */
  test("existem defesas em JS contra zoom (o que o iOS exige)", async ({ page }) => {
    await page.goto("")
    await page.waitForTimeout(500)

    const defenses = await page.evaluate(() => {
      const fire = (target: EventTarget, ev: Event) => {
        target.dispatchEvent(ev)
        return ev.defaultPrevented
      }
      const opts = { bubbles: true, cancelable: true }
      return {
        // Gestos proprietários do Safari — a única forma de barrar pinça no iOS.
        gesturestart: fire(document, new Event("gesturestart", opts)),
        gesturechange: fire(document, new Event("gesturechange", opts)),
        // Zoom por trackpad / Ctrl+scroll.
        ctrlWheel: fire(
          document,
          new WheelEvent("wheel", { ...opts, ctrlKey: true, deltaY: -120 }),
        ),
        // Duplo toque: barrado por CSS (touch-action: manipulation), não por JS.
        touchAction: getComputedStyle(document.documentElement).touchAction,
      }
    })

    await test.info().attach("defesas-anti-zoom.json", {
      body: JSON.stringify(defenses, null, 2),
      contentType: "application/json",
    })

    expect
      .soft(
        defenses.gesturestart,
        "nada intercepta `gesturestart` — no Safari iOS a pinça dá zoom, pois `user-scalable=no` é ignorado desde o iOS 10",
      )
      .toBe(true)
    expect
      .soft(defenses.ctrlWheel, "nada intercepta Ctrl+wheel (zoom por trackpad)")
      .toBe(true)
  })

  test("medição de scroll por rota", async ({ page, browserName }) => {
    // Diagnóstico: quanto cada rota rola, e qual elemento é o scrollingElement.
    // Imprime uma tabela no stdout para comparar Chromium × WebKit.
    const rows: string[] = []
    for (const route of ROUTES) {
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible()
      await page.waitForTimeout(700)

      const before = await page.evaluate(() => ({
        docH: document.documentElement.scrollHeight,
        bodyH: document.body.scrollHeight,
        vh: window.innerHeight,
        scrollEl: document.scrollingElement?.tagName ?? "?",
      }))

      if (browserName !== "webkit") {
        await page.mouse.move(195, 400)
        await page.mouse.wheel(0, 800)
        await page.waitForTimeout(350)
      }

      const after = await page.evaluate(() => ({
        scrollY: window.scrollY,
        scrollTop: document.scrollingElement?.scrollTop ?? -1,
      }))

      rows.push(
        `${route.name.padEnd(20)} docH=${String(before.docH).padEnd(6)} ` +
          `bodyH=${String(before.bodyH).padEnd(6)} vh=${String(before.vh).padEnd(5)} ` +
          `scrollEl=${before.scrollEl.padEnd(5)} → scrollY=${after.scrollY} scrollTop=${after.scrollTop}`,
      )
    }

    const table = `[${browserName}]\n${rows.join("\n")}`
    console.log(table)
    await test.info().attach("medicao-de-scroll.txt", {
      body: table,
      contentType: "text/plain",
    })
  })

  test("inventário de elementos que rolam de propósito", async ({ page }) => {
    // A paleta de cores É scrollável por design. Uma correção futura que
    // aplique `touch-action: none` global quebraria isto — o inventário
    // existe para que a correção não crie um bug novo.
    const found: Record<string, unknown> = {}
    for (const route of ROUTES) {
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible()
      await page.waitForTimeout(300)
      found[route.name] = await findScrollableElements(page)
    }
    await test.info().attach("elementos-scrollaveis.json", {
      body: JSON.stringify(found, null, 2),
      contentType: "application/json",
    })
  })
})
