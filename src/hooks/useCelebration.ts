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

  // Always pick the HIGHEST milestone the current progress satisfies, so a
  // single click that jumps past multiple thresholds (e.g. 50%→100% on a
  // 2-path drawing) lands on "complete" instead of degrading to a lower one.
  const computedMilestone: Milestone =
    progress >= 100 ? "complete" : progress >= 75 ? "three-quarters" : progress >= 50 ? "half" : "none"

  const alreadySeen = seenMilestones.includes(computedMilestone)

  if (computedMilestone !== "none" && !alreadySeen && activeMilestone !== computedMilestone) {
    // Mark every threshold up to and including the current one as seen so
    // the next render doesn't "downgrade" the active milestone.
    setSeenMilestones((prev) => {
      const next = [...prev]
      if (progress >= 50 && !next.includes("half")) next.push("half")
      if (progress >= 75 && !next.includes("three-quarters")) next.push("three-quarters")
      if (progress >= 100 && !next.includes("complete")) next.push("complete")
      return next
    })
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
