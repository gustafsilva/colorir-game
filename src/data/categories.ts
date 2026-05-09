export interface CategoryMeta {
  id: string
  label: string
  emoji: string
}

export const CATEGORY_ORDER: CategoryMeta[] = [
  { id: "personagens", label: "Personagens", emoji: "🎭" },
  { id: "animais", label: "Animais", emoji: "🐾" },
  { id: "natureza", label: "Natureza", emoji: "🌿" },
  { id: "formas", label: "Formas", emoji: "⭐" },
  { id: "frutas", label: "Frutas e comidas", emoji: "🍎" },
  { id: "letras", label: "Letras", emoji: "🔤" },
  { id: "numeros", label: "Números", emoji: "🔢" },
]
