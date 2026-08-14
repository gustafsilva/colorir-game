/**
 * Seleção por role + aria-label (pt-BR).
 *
 * O projeto não tem NENHUM data-testid, e esta rodada de QA não pode
 * modificar src/. Se algum jogo se mostrar impossível de dirigir pelos
 * seletores acessíveis existentes, isso é um achado de acessibilidade
 * — vira bug na doc, não um testid novo.
 */

/**
 * Botão de voltar. Mesmo rótulo em toda tela (BUG-07 corrigido — ver
 * docs/bugs.md); a galeria usa um `<a>`, os jogos usam `<button>`, então
 * ANY_BACK casa os dois elementos pelo aria-label comum.
 */
export const BACK_BUTTON = 'button[aria-label="Voltar para o início"]'
export const ANY_BACK = '[aria-label="Voltar para o início"]'

// --- Patinhos no Ninho ---------------------------------------------------
export const DUCK = '[role="button"][aria-label^="Patinho "]'
export const DUCK_ACTIVE = `${DUCK}:not([aria-disabled="true"])`
export const NEST = '[role="img"][aria-label^="Ninho "]'
export const NEST_EMPTY = `${NEST}:not([aria-label*="com patinho"])`
export const BALLOON = 'button[aria-label="Estourar balão"]'

/** "Patinho vermelho" → "vermelho" */
export function duckColor(label: string): string {
  return label.replace(/^Patinho\s+/, "").trim()
}

/** "Ninho vermelho" / "Ninho vermelho com patinho" → "vermelho" */
export function nestColor(label: string): string {
  return label.replace(/^Ninho\s+/, "").replace(/\s+com patinho$/, "").trim()
}

// --- Encaixe de Formas ---------------------------------------------------
export const PIECE = '[role="button"][aria-label^="Peça em forma de "]'
export const HOLE = '[role="img"][aria-label^="Buraco em forma de "]'
export const HOLE_EMPTY = `${HOLE}:not([aria-label*="com peça"])`

export function pieceShape(label: string): string {
  return label.replace(/^Peça em forma de\s+/, "").trim()
}

export function holeShape(label: string): string {
  return label.replace(/^Buraco em forma de\s+/, "").replace(/\s+com peça encaixada$/, "").trim()
}

// --- Memória -------------------------------------------------------------
export const CARD_DOWN = 'button[aria-label="Carta virada para baixo"]'
export const CARD_UP = 'button[aria-label^="Carta aberta: "]'
export const CARD_ANY = "button[aria-label^='Carta ']"

export function cardFace(label: string): string {
  return label.replace(/^Carta aberta:\s*/, "").trim()
}

// --- Caça-Coelho ---------------------------------------------------------
export const BURROW = '[role="gridcell"]'
export const BURROW_ACTIVE = '[role="gridcell"][aria-label^="Coelho na toca"]'
export const RABBIT_GRID = '[role="grid"][aria-label="Tabuleiro do Caça-Coelho"]'

// --- Salão de Unhas ------------------------------------------------------
export const NAIL_SURFACE_GROUP = '[role="group"][aria-label="Escolher mão ou pé"]'
export const NAIL_HAND_BTN = 'button[aria-label="Pintar as unhas da mão"]'
export const NAIL_FOOT_BTN = 'button[aria-label="Pintar as unhas do pé"]'
export const NAIL_TOOLS = '[role="radiogroup"][aria-label="Ferramentas do salão"]'
export const NAIL_UNDO = 'button[aria-label="Desfazer"]'
export const NAIL_CLEAR = 'button[aria-label="Limpar tudo"]'
export const NAIL_TARGET = '[role="button"]'

// --- Quebra-Cabeça ---------------------------------------------------------
export const PUZZLE_PIECE = '[role="button"][aria-label^="Peça do quebra-cabeça "]'
export const PUZZLE_SLOT = '[role="img"][aria-label^="Lugar da peça "]'
export const PUZZLE_SLOT_EMPTY = `${PUZZLE_SLOT}:not([aria-label*="com peça"])`

/** "Peça do quebra-cabeça 3" → "3" */
export function puzzlePieceNumber(label: string): string {
  return label.replace(/^Peça do quebra-cabeça\s+/, "").trim()
}

/** "Lugar da peça 3" / "Lugar da peça 3 com peça encaixada" → "3" */
export function puzzleSlotNumber(label: string): string {
  return label.replace(/^Lugar da peça\s+/, "").replace(/\s+com peça encaixada$/, "").trim()
}

// --- Colorir -------------------------------------------------------------
export const PALETTE = '[role="radiogroup"][aria-label="Paleta de cores"]'
export const PALETTE_COLOR = `${PALETTE} [role="radio"]`
export const COLORABLE_PATH = ".colorable-path"

// --- Overlays ------------------------------------------------------------
export const CELEBRATION = '[role="button"][aria-label$=" — toque para continuar"]'
export const PHASE_INDICATOR = '[aria-label^="Fase "]'
export const ROTATE_DEVICE_OVERLAY = '.rotate-device-overlay'

// --- Rotas ---------------------------------------------------------------
// Declarado por último de propósito: as constantes acima são usadas aqui.

export interface Route {
  path: string
  name: string
  /** Um seletor que prova que a página carregou de verdade. */
  ready: string
}

export const ROUTES: Route[] = [
  { path: "", name: "Início (hub)", ready: "a[href*='duck-nest']" },
  { path: "coloring", name: "Galeria de colorir", ready: "a[href*='coloring/']" },
  { path: "rabbit-hunt", name: "Caça-Coelho", ready: RABBIT_GRID },
  { path: "nail-salon", name: "Salão de Unhas", ready: NAIL_SURFACE_GROUP },
  { path: "duck-nest", name: "Patinhos no Ninho", ready: DUCK },
  { path: "shape-fit", name: "Encaixe de Formas", ready: PIECE },
  { path: "fruit-slice", name: "Corta-Frutas", ready: BACK_BUTTON },
  { path: "memory", name: "Memória", ready: CARD_DOWN },
  { path: "puzzle", name: "Quebra-Cabeça", ready: PUZZLE_PIECE },
]

// --- localStorage --------------------------------------------------------
export const STORAGE_KEYS = [
  "coloring-completed",
  "rabbit-hunt-highscore",
  "coloring-tutorial-seen",
  "rabbit-tutorial-seen",
] as const
