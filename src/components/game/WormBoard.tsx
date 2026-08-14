import FruitSVG, { type FruitKind } from "@/components/game/FruitSVG"
import StarBurst from "@/components/game/StarBurst"
import { WormHeadSVG, WormSegmentSVG } from "@/components/game/WormSVG"
import {
  GRID_COLS,
  GRID_ROWS,
  type Cell,
  type Direction,
  type FruitData,
} from "@/hooks/useWormGame"

export const FRUIT_LABELS: Record<FruitKind, string> = {
  apple: "maçã",
  banana: "banana",
  orange: "laranja",
  watermelon: "melancia",
  strawberry: "morango",
}

const CELL_W = `calc(100% / ${GRID_COLS})`
const CELL_H = `calc(100% / ${GRID_ROWS})`

/** Posiciona um elemento do tamanho de 1 célula na célula (x, y).
 * translate em % da própria caixa mapeia 1:1 no grid — o "andar" da
 * minhoca é só a transition de transform do .worm-segment. */
function cellTransform({ x, y }: Cell): React.CSSProperties {
  return {
    width: CELL_W,
    height: CELL_H,
    transform: `translate(${x * 100}%, ${y * 100}%)`,
  }
}

interface WormBoardProps {
  worm: Cell[]
  fruit: FruitData | null
  dir: Direction
  justAte: boolean
  onFruitTap: () => void
}

export default function WormBoard({
  worm,
  fruit,
  dir,
  justAte,
  onFruitTap,
}: WormBoardProps) {
  return (
    <div
      role="group"
      aria-label="Jardim da Minhoca Comilona"
      className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border-[3px] border-white/80 bg-gradient-to-b from-lime-100 to-emerald-100 shadow-lg"
      style={{ aspectRatio: `${GRID_COLS} / ${GRID_ROWS}` }}
    >
      {/* Xadrez sutil de gramado */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-conic-gradient(rgba(255,255,255,0.28) 0% 25%, transparent 0% 50%)",
          backgroundSize: `calc(200% / ${GRID_COLS}) calc(200% / ${GRID_ROWS})`,
        }}
      />

      {/* Minhoca — rabo primeiro no DOM para a cabeça ficar por cima.
          Keys por índice a partir da cabeça: em cada passo o elemento j
          anda para a célula do j-1 (transition), e o segmento novo do
          crescimento monta no rabo com key nova (dispara worm-grow-pop). */}
      <div
        role="img"
        aria-label={`Minhoca com ${worm.length} segmentos`}
        className="pointer-events-none absolute inset-0"
      >
        {worm
          .map((cell, i) => ({ cell, i }))
          .reverse()
          .map(({ cell, i }) => (
            <div
              key={i}
              className="worm-segment absolute left-0 top-0"
              style={cellTransform(cell)}
            >
              {/* A cabeça não usa worm-grow-pop: alternar para worm-chomp e
                  voltar reiniciaria a animação de entrada a cada nhac. */}
              <div
                className={
                  i === 0
                    ? `h-full w-full ${justAte ? "worm-chomp" : ""}`
                    : "worm-grow-pop h-full w-full"
                }
              >
                {i === 0 ? (
                  <WormHeadSVG dir={dir} chomp={justAte} className="h-full w-full" />
                ) : (
                  <WormSegmentSVG
                    tone={(i % 2) as 0 | 1}
                    className="h-full w-full"
                  />
                )}
              </div>
              {i === 0 && justAte && <StarBurst />}
            </div>
          ))}
      </div>

      {/* Fruta — único alvo tocável do tabuleiro, ocupa a célula inteira */}
      {fruit && (
        <button
          type="button"
          aria-label={`Fruta ${FRUIT_LABELS[fruit.kind]} — toque para a minhoca comer`}
          onClick={onFruitTap}
          className="absolute left-0 top-0 cursor-pointer touch-none select-none border-none bg-transparent p-0 outline-none focus-visible:rounded-full focus-visible:ring-4 focus-visible:ring-white/70"
          style={cellTransform(fruit.cell)}
        >
          <div className="fruit-bob h-full w-full p-0.5">
            <FruitSVG kind={fruit.kind} className="h-full w-full" />
          </div>
        </button>
      )}
    </div>
  )
}
