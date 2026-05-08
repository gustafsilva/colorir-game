import { useState, useEffect, useCallback, useMemo } from "react"

type Milestone = "none" | "half" | "three-quarters" | "complete"

export function useCelebration(fills: Record<string, string>, totalPaths: number) {
  const [activeMilestone, setActiveMilestone] = useState<Milestone>("none")
  const [seenMilestones, setSeenMilestones] = useState<Milestone[]>([])

  const progress = useMemo(() => {
    if (totalPaths === 0) return 0
    return Math.round((Object.keys(fills).length / totalPaths) * 100)
  }, [fills, totalPaths])

  const fillCount = Object.keys(fills).length

  // Reset when fills are cleared (setState during render pattern)
  if (fillCount === 0 && seenMilestones.length > 0) {
    setSeenMilestones([])
    if (activeMilestone !== "none") {
      setActiveMilestone("none")
    }
  }

  // Detect milestone crossings (setState during render pattern)
  const computedMilestone = (() => {
    if (progress >= 100 && !seenMilestones.includes("complete")) return "complete" as const
    if (progress >= 75 && !seenMilestones.includes("three-quarters")) return "three-quarters" as const
    if (progress >= 50 && !seenMilestones.includes("half")) return "half" as const
    return "none" as const
  })()

  if (computedMilestone !== "none" && activeMilestone !== computedMilestone) {
    setSeenMilestones((prev) => [...prev, computedMilestone])
    setActiveMilestone(computedMilestone)
  }

  // Auto-dismiss after 3 seconds (setTimeout callback is async, not synchronous)
  useEffect(() => {
    if (activeMilestone === "none") return

    const timer = setTimeout(() => {
      setActiveMilestone("none")
    }, 3000)

    return () => clearTimeout(timer)
  }, [activeMilestone])

  const dismissMilestone = useCallback(() => {
    setActiveMilestone("none")
  }, [])

  return { progress, milestone: activeMilestone, dismissMilestone }
}
