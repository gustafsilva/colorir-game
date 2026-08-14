import { useCallback, useEffect, useRef, useState } from "react"
import FruitSVG, { BombSVG, BoomSVG, FRUIT_KINDS, type FruitKind } from "./FruitSVG"
import type { PhaseConfig } from "@/hooks/useFruitSlice"

type EntityKind = FruitKind | "bomb"

/** Parte estática da entidade, renderizada pelo React. */
interface EntityRender {
  id: number
  kind: EntityKind
  /** Lado do quadrado que contém o SVG, em px. */
  size: number
  x: number
  y: number
}

/** Estado físico, vive só dentro do efeito da simulação. */
interface SimEntity {
  id: number
  kind: EntityKind
  size: number
  x: number
  y: number
  /** Velocidades em px/ms; gravidade em px/ms². */
  vx: number
  vy: number
  g: number
  rot: number
  vr: number
}

interface HalfPiece {
  id: number
  kind: FruitKind
  side: "left" | "right"
  x: number
  y: number
  size: number
  rot: number
}

interface Boom {
  id: number
  x: number
  y: number
  size: number
}

interface FruitFieldProps {
  config: PhaseConfig
  /** Só spawna e corta quando true (mode === "playing"). */
  active: boolean
  /** Mudou → o campo remonta limpo (frutas em voo descartadas). */
  resetSignal: number
  onFruitSliced: (kind: FruitKind) => void
  onBombSliced: () => void
}

const MAX_ALIVE = 3
/** Folga extra além do raio visual — mira generosa para dedos pequenos. */
const HIT_MARGIN = 20
const TRAIL_MAX_POINTS = 14
/** Meia-largura da lâmina na ponta do dedo, em px. */
const BLADE_HALF_WIDTH = 16

/**
 * Contorno de "lâmina" estilo Fruit Ninja para o rastro do dedo:
 * um polígono afilado — largura zero na cauda, máxima na ponta —
 * construído deslocando cada ponto pela normal do traçado.
 */
function bladePath(points: { x: number; y: number }[], maxHalfWidth: number): string {
  // Pontos praticamente coincidentes geram normais instáveis
  const pts = points.filter(
    (p, i, arr) => i === 0 || Math.hypot(p.x - arr[i - 1].x, p.y - arr[i - 1].y) > 0.5,
  )
  if (pts.length < 2) return ""

  const n = pts.length
  const left: string[] = []
  const right: string[] = []
  for (let i = 0; i < n; i++) {
    const prev = pts[Math.max(0, i - 1)]
    const next = pts[Math.min(n - 1, i + 1)]
    let dx = next.x - prev.x
    let dy = next.y - prev.y
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    // t^1.5 deixa a cauda pontuda mas dá corpo de lâmina perto do dedo
    const t = i / (n - 1)
    const w = maxHalfWidth * t * Math.sqrt(t)
    const nx = -dy * w
    const ny = dx * w
    left.push(`${(pts[i].x + nx).toFixed(1)} ${(pts[i].y + ny).toFixed(1)}`)
    right.push(`${(pts[i].x - nx).toFixed(1)} ${(pts[i].y - ny).toFixed(1)}`)
  }
  return `M ${left.join(" L ")} L ${right.reverse().join(" L ")} Z`
}

interface TrailEls {
  outer: SVGPathElement | null
  inner: SVGPathElement | null
}

/** Distância² de um ponto ao segmento AB — teste de corte swipe × fruta. */
function distSqToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const abx = bx - ax
  const aby = by - ay
  const lenSq = abx * abx + aby * aby
  const t =
    lenSq === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq))
  const dx = px - (ax + t * abx)
  const dy = py - (ay + t * aby)
  return dx * dx + dy * dy
}

/**
 * Campo de jogo do Corta-Frutas.
 *
 * A remontagem via `key` é o reset: trocar o resetSignal descarta toda a
 * simulação e o React desmonta frutas, metades e explosões de uma vez.
 */
export default function FruitField({ resetSignal, ...props }: FruitFieldProps) {
  return <Field key={resetSignal} {...props} />
}

/**
 * Um único requestAnimationFrame integra física (parábola), spawn e rastro.
 * A simulação vive em variáveis locais de UM useEffect (padrão do
 * AnimatedBackground/CelebrationOverlay); a posição por frame é escrita
 * DIRETO no DOM — nunca setState por frame (regra da casa, ver
 * ShapeDraggable). React só re-renderiza em spawn/remoção.
 *
 * Sem setPointerCapture: as frutas se movem sob o dedo; os listeners ficam
 * no container full-screen e cada pointer ativo (multi-touch) guarda seu
 * último ponto para o teste segmento × círculo.
 */
function Field({
  config,
  active,
  onFruitSliced,
  onBombSliced,
}: Omit<FruitFieldProps, "resetSignal">) {
  const containerRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef(new Map<number, HTMLDivElement>())
  const trailElsRef = useRef(new Map<number, TrailEls>())

  const [entities, setEntities] = useState<EntityRender[]>([])
  const [halves, setHalves] = useState<HalfPiece[]>([])
  const [booms, setBooms] = useState<Boom[]>([])
  const [activeTrails, setActiveTrails] = useState<number[]>([])

  const configRef = useRef(config)
  const activeRef = useRef(active)
  const onFruitRef = useRef(onFruitSliced)
  const onBombRef = useRef(onBombSliced)

  useEffect(() => {
    configRef.current = config
    activeRef.current = active
    onFruitRef.current = onFruitSliced
    onBombRef.current = onBombSliced
  }, [config, active, onFruitSliced, onBombSliced])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ── Tamanho real do container (o app roda de celular a desktop) ──
    let width = 0
    let height = 0
    const measure = () => {
      const rect = container.getBoundingClientRect()
      width = rect.width
      height = rect.height
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)

    // ── Simulação ──
    let sim: SimEntity[] = []
    let nextId = 0
    let spawnAcc = Number.MAX_SAFE_INTEGER // primeira fruta sai já
    const pointers = new Map<number, { x: number; y: number }>()
    // grew: o dedo andou desde o último frame — o rastro não deve encolher
    const trails = new Map<number, { points: { x: number; y: number }[]; grew: boolean }>()

    const drawTrail = (pointerId: number, points: { x: number; y: number }[]) => {
      const els = trailElsRef.current.get(pointerId)
      if (!els) return
      els.outer?.setAttribute("d", bladePath(points, BLADE_HALF_WIDTH))
      els.inner?.setAttribute("d", bladePath(points, BLADE_HALF_WIDTH * 0.45))
    }

    const spawn = () => {
      if (width === 0 || height === 0) return
      const cfg = configRef.current

      const size = Math.round(Math.min(120, Math.max(72, width * 0.2)))
      const hasBomb = sim.some((e) => e.kind === "bomb")
      const kind: EntityKind =
        cfg.bombChance > 0 && !hasBomb && Math.random() < cfg.bombChance
          ? "bomb"
          : FRUIT_KINDS[Math.floor(Math.random() * FRUIT_KINDS.length)]

      const x = width * 0.08 + Math.random() * Math.max(1, width * 0.84 - size)
      const y = height + size
      // Parábola derivada do tempo de voo e do ápice sorteado — nada de
      // constantes absolutas: funciona em qualquer altura de tela.
      const flight = cfg.flightMs * (0.85 + Math.random() * 0.3)
      const tUp = flight / 2
      const apexY = height * (0.16 + Math.random() * 0.24)
      const g = (2 * (y - apexY)) / (tUp * tUp)

      const ent: SimEntity = {
        id: ++nextId,
        kind,
        size,
        x,
        y,
        vx: ((width / 2 - (x + size / 2)) / flight) * 0.6,
        vy: -g * tUp,
        g,
        rot: 0,
        vr: (Math.random() * 2 - 1) * 0.05,
      }
      sim.push(ent)
      setEntities((prev) => [
        ...prev,
        { id: ent.id, kind: ent.kind, size: ent.size, x: ent.x, y: ent.y },
      ])
    }

    const step = (dt: number) => {
      if (activeRef.current) {
        spawnAcc += dt
        if (spawnAcc >= configRef.current.spawnMs && sim.length < MAX_ALIVE) {
          spawnAcc = 0
          spawn()
        }
      }

      for (const ent of sim) {
        ent.vy += ent.g * dt
        ent.x += ent.vx * dt
        ent.y += ent.vy * dt
        ent.rot += ent.vr * dt
        const node = nodesRef.current.get(ent.id)
        if (node) {
          node.style.transform = `translate3d(${ent.x}px, ${ent.y}px, 0) rotate(${ent.rot}deg)`
        }
      }

      // Caiu sem ser cortada: some sem penalidade
      const fallen = sim.filter((e) => e.vy > 0 && e.y > height + e.size * 1.5)
      if (fallen.length > 0) {
        const gone = new Set(fallen.map((e) => e.id))
        sim = sim.filter((e) => !gone.has(e.id))
        setEntities((prev) => prev.filter((e) => !gone.has(e.id)))
      }

      // Rastro só encolhe pelo rabo nos frames em que o dedo NÃO andou
      // (senão push e shift se anulam e a lâmina nunca cresce); depois de
      // soltar, persiste um instante até a cauda se dissolver
      for (const [pointerId, trail] of trails) {
        if (trail.grew) {
          trail.grew = false
        } else if (trail.points.length > 1) {
          trail.points.shift()
        } else if (!pointers.has(pointerId)) {
          trails.delete(pointerId)
          setActiveTrails((prev) => prev.filter((id) => id !== pointerId))
          continue
        }
        drawTrail(pointerId, trail.points)
      }
    }

    /** Corta tudo que o segmento do swipe atravessa; bomba tem prioridade. */
    const slice = (ax: number, ay: number, bx: number, by: number) => {
      if (!activeRef.current) return

      const hits = sim.filter((ent) => {
        const cx = ent.x + ent.size / 2
        const cy = ent.y + ent.size / 2
        const r = ent.size / 2 + HIT_MARGIN
        return distSqToSegment(cx, cy, ax, ay, bx, by) <= r * r
      })
      if (hits.length === 0) return

      const bomb = hits.find((e) => e.kind === "bomb")
      if (bomb) {
        // A explosão fica no lugar da bomba e o campo limpa na hora
        setBooms((prev) => [
          ...prev,
          {
            id: ++nextId,
            x: bomb.x - bomb.size * 0.3,
            y: bomb.y - bomb.size * 0.3,
            size: bomb.size * 1.6,
          },
        ])
        sim = []
        setEntities([])
        onBombRef.current()
        return
      }

      const gone = new Set(hits.map((e) => e.id))
      sim = sim.filter((e) => !gone.has(e.id))
      setEntities((prev) => prev.filter((e) => !gone.has(e.id)))
      setHalves((prev) => [
        ...prev,
        ...hits.flatMap((e) =>
          (["left", "right"] as const).map((side) => ({
            id: ++nextId,
            kind: e.kind as FruitKind,
            side,
            x: e.x,
            y: e.y,
            size: e.size,
            rot: e.rot,
          })),
        ),
      ])
      for (const hit of hits) onFruitRef.current(hit.kind as FruitKind)
    }

    // ── Pointer events (multi-touch) ──
    const localPoint = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const onPointerDown = (e: PointerEvent) => {
      const p = localPoint(e)
      pointers.set(e.pointerId, p)
      trails.set(e.pointerId, { points: [p], grew: true })
      setActiveTrails((prev) =>
        prev.includes(e.pointerId) ? prev : [...prev, e.pointerId],
      )
    }

    const onPointerMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId)
      if (!prev) return
      const p = localPoint(e)
      pointers.set(e.pointerId, p)

      slice(prev.x, prev.y, p.x, p.y)

      const trail = trails.get(e.pointerId)
      if (trail) {
        trail.points.push(p)
        while (trail.points.length > TRAIL_MAX_POINTS) trail.points.shift()
        trail.grew = true
        drawTrail(e.pointerId, trail.points)
      }
    }

    // A lâmina não some junto com o dedo: o loop consome os pontos
    // restantes e remove o rastro quando a cauda acaba
    const onPointerEnd = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
    }

    container.addEventListener("pointerdown", onPointerDown)
    container.addEventListener("pointermove", onPointerMove)
    container.addEventListener("pointerup", onPointerEnd)
    container.addEventListener("pointercancel", onPointerEnd)
    container.addEventListener("pointerleave", onPointerEnd)

    // ── Loop ──
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      // Clamp: aba em background não pode teleportar as frutas na volta
      const dt = Math.min(now - last, 32)
      last = now
      step(dt)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      container.removeEventListener("pointerdown", onPointerDown)
      container.removeEventListener("pointermove", onPointerMove)
      container.removeEventListener("pointerup", onPointerEnd)
      container.removeEventListener("pointercancel", onPointerEnd)
      container.removeEventListener("pointerleave", onPointerEnd)
    }
  }, [])

  const removeHalf = useCallback((id: number) => {
    setHalves((prev) => prev.filter((half) => half.id !== id))
  }, [])

  const removeBoom = useCallback((id: number) => {
    setBooms((prev) => prev.filter((boom) => boom.id !== id))
  }, [])

  return (
    <div
      ref={containerRef}
      // touch-none é crítico: sem ele o navegador rouba o swipe p/ scroll
      className="absolute inset-0 touch-none select-none overflow-hidden"
    >
      {entities.map((ent) => (
        <div
          key={ent.id}
          ref={(el) => {
            if (el) nodesRef.current.set(ent.id, el)
            else nodesRef.current.delete(ent.id)
          }}
          aria-hidden="true"
          className="absolute top-0 left-0 will-change-transform"
          style={{
            width: ent.size,
            height: ent.size,
            transform: `translate3d(${ent.x}px, ${ent.y}px, 0)`,
          }}
        >
          {ent.kind === "bomb" ? (
            <BombSVG className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]" />
          ) : (
            <FruitSVG
              kind={ent.kind}
              className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
            />
          )}
        </div>
      ))}

      {halves.map((half) => (
        <div
          key={half.id}
          aria-hidden="true"
          className="absolute"
          style={{ left: half.x, top: half.y, width: half.size, height: half.size }}
        >
          {/* Rotação herdada da fruta num wrapper próprio — a animação
              das metades mexe em transform e sobrescreveria a base */}
          <div className="h-full w-full" style={{ transform: `rotate(${half.rot}deg)` }}>
            <div
              className="fruit-half h-full w-full"
              style={{
                ["--fly-x" as string]: half.side === "left" ? "-64px" : "64px",
                ["--fly-rot" as string]: half.side === "left" ? "-40deg" : "40deg",
              }}
              onAnimationEnd={() => removeHalf(half.id)}
            >
              <FruitSVG kind={half.kind} variant={half.side} className="h-full w-full" />
            </div>
          </div>
        </div>
      ))}

      {booms.map((boom) => (
        <div
          key={boom.id}
          aria-hidden="true"
          className="absolute"
          style={{ left: boom.x, top: boom.y, width: boom.size, height: boom.size }}
        >
          <div className="bomb-boom h-full w-full" onAnimationEnd={() => removeBoom(boom.id)}>
            <BoomSVG className="h-full w-full" />
          </div>
        </div>
      ))}

      {/* Lâmina estilo Fruit Ninja: polígono afilado por pointer ativo,
          borda de aço + miolo branco brilhante, atualizado via ref */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        {activeTrails.map((pointerId) => {
          // Refs dos filhos rodam antes do pai: cada path cria a entrada
          // sob demanda; o <g> só limpa o Map quando o rastro desmonta
          const getEls = (): TrailEls => {
            let els = trailElsRef.current.get(pointerId)
            if (!els) {
              els = { outer: null, inner: null }
              trailElsRef.current.set(pointerId, els)
            }
            return els
          }
          return (
            <g
              key={pointerId}
              ref={(el) => {
                if (!el) trailElsRef.current.delete(pointerId)
              }}
            >
              <path
                ref={(el) => {
                  getEls().outer = el
                }}
                fill="rgba(148,180,215,0.45)"
              />
              <path
                ref={(el) => {
                  getEls().inner = el
                }}
                fill="rgba(255,255,255,0.95)"
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
