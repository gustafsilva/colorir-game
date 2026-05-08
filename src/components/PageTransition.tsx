import { cn } from "@/lib/utils"

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export default function PageTransition({
  children,
  className,
}: PageTransitionProps) {
  return (
    <div
      className={cn(
        "animate-page-enter motion-reduce:animate-none motion-reduce:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  )
}
