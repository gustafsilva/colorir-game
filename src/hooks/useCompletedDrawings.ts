import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "coloring-completed"

function readCompleted(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) return new Set(parsed.filter((v): v is string => typeof v === "string"))
    return new Set()
  } catch {
    return new Set()
  }
}

function writeCompleted(set: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)))
  } catch {
    // ignore quota or privacy-mode errors
  }
}

/**
 * Tracks which drawings the child has fully colored, persisted in localStorage.
 * Returns helpers to check, mark, and clear completion state.
 */
export function useCompletedDrawings() {
  const [completed, setCompleted] = useState<Set<string>>(() => readCompleted())

  // Listen for cross-tab updates so two open tabs stay in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setCompleted(readCompleted())
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const markCompleted = useCallback((id: string) => {
    setCompleted((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      writeCompleted(next)
      return next
    })
  }, [])

  const isCompleted = useCallback(
    (id: string) => completed.has(id),
    [completed],
  )

  return { completed, isCompleted, markCompleted }
}
