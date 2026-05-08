import { useCallback, useState } from "react"

const STORAGE_KEY = "coloring-tutorial-seen"

function readSeen(): boolean {
  if (typeof window === "undefined") return true
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return true
  }
}

/**
 * Tracks whether the child has dismissed the first-time coloring hint.
 * Returns the current state plus a `dismissHint` callback to persist it.
 */
export function useFirstTimeUser() {
  const [hasSeenHint, setHasSeenHint] = useState<boolean>(() => readSeen())

  const dismissHint = useCallback(() => {
    if (hasSeenHint) return
    setHasSeenHint(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, "true")
    } catch {
      // ignore quota or privacy-mode errors
    }
  }, [hasSeenHint])

  return { hasSeenHint, dismissHint }
}
