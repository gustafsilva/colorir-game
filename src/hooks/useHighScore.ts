import { useCallback, useEffect, useState } from "react"

function readScore(key: string): number {
  if (typeof window === "undefined") return 0
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return 0
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
  } catch {
    return 0
  }
}

function writeScore(key: string, value: number) {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // ignore quota or privacy-mode errors
  }
}

export function useHighScore(key: string) {
  const [highScore, setHighScore] = useState<number>(() => readScore(key))

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setHighScore(readScore(key))
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [key])

  const submit = useCallback(
    (value: number): boolean => {
      let isNewRecord = false
      setHighScore((prev) => {
        if (value > prev) {
          isNewRecord = true
          writeScore(key, value)
          return value
        }
        return prev
      })
      return isNewRecord
    },
    [key],
  )

  return { highScore, submit }
}
