import { useCallback, useState } from "react"

const STORAGE_KEY = "rabbit-tutorial-seen"

function readSeen(): boolean {
  if (typeof window === "undefined") return true
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return true
  }
}

export function useFirstTimeRabbit() {
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
