import { DeviceRotate } from "@phosphor-icons/react"

/**
 * Cobre a tela quando o celular está em paisagem — os jogos são
 * desenhados para retrato e não cabem numa tela deitada pequena. A
 * visibilidade é 100% CSS (ver .rotate-device-overlay em index.css),
 * então funciona mesmo sem JS reagir ao evento de orientação.
 */
export default function RotateDeviceOverlay() {
  return (
    <div
      role="status"
      aria-label="Vire o aparelho para o modo retrato para jogar"
      className="rotate-device-overlay fixed inset-0 z-[100] flex-col items-center justify-center gap-4 bg-[var(--color-crayon-purple)] px-8 text-center text-white"
    >
      <DeviceRotate
        size={72}
        weight="duotone"
        className="rotate-device-icon motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p className="text-puffy-sm text-2xl">Vire o aparelho</p>
      <p className="max-w-xs text-base opacity-90">Este joguinho é melhor na tela em pé 📱</p>
    </div>
  )
}
