import BurrowCell from "./BurrowCell"

interface RabbitGridProps {
  activeIndex: number | null
  onCatch: (index: number) => void
}

export default function RabbitGrid({ activeIndex, onCatch }: RabbitGridProps) {
  return (
    <div
      role="grid"
      aria-label="Tabuleiro do Caça-Coelho"
      className="grid aspect-square w-full max-w-[460px] grid-cols-3 grid-rows-3 gap-3 sm:gap-4"
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <BurrowCell
          key={i}
          index={i}
          isActive={activeIndex === i}
          onCatch={onCatch}
        />
      ))}
    </div>
  )
}
