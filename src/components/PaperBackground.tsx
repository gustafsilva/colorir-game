import { memo } from "react"

/**
 * PaperBackground — soft pastel scenery layer rendered behind the app.
 *
 * Renders inline SVG with two fluffy clouds at the top and two rolling hills
 * at the bottom. Sits beneath the existing pastel gradient background and the
 * AnimatedBackground particle layer. Cheap to render: most of the SVG is
 * static; only the two clouds animate via `transform: translateX` (GPU
 * compositor). Respects `prefers-reduced-motion`.
 */
function PaperBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="paper-hill-1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.85 0.06 320)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="oklch(0.92 0.04 60)" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="paper-hill-2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.88 0.05 30)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="oklch(0.95 0.03 60)" stopOpacity="0.25" />
          </linearGradient>
          <radialGradient id="paper-cloud-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.95" />
            <stop offset="100%" stopColor="white" stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* Distant hills — static, low contrast */}
        <path
          d="M-100 760 C 200 660 380 720 620 700 C 880 680 1080 740 1240 700 C 1360 670 1500 720 1540 730 L 1540 920 L -100 920 Z"
          fill="url(#paper-hill-1)"
        />
        <path
          d="M-100 820 C 240 760 460 800 720 780 C 980 760 1200 820 1540 800 L 1540 920 L -100 920 Z"
          fill="url(#paper-hill-2)"
        />

        {/* Cloud 1 — drifts left to right slowly */}
        <g className="paper-cloud paper-cloud-1">
          <g transform="translate(220 160)">
            <ellipse cx="0" cy="0" rx="75" ry="38" fill="url(#paper-cloud-glow)" />
            <ellipse cx="-55" cy="10" rx="42" ry="28" fill="url(#paper-cloud-glow)" />
            <ellipse cx="55" cy="10" rx="48" ry="30" fill="url(#paper-cloud-glow)" />
            <ellipse cx="20" cy="-22" rx="36" ry="24" fill="url(#paper-cloud-glow)" />
          </g>
        </g>

        {/* Cloud 2 — drifts opposite direction */}
        <g className="paper-cloud paper-cloud-2">
          <g transform="translate(1080 240)">
            <ellipse cx="0" cy="0" rx="92" ry="44" fill="url(#paper-cloud-glow)" />
            <ellipse cx="-65" cy="14" rx="50" ry="32" fill="url(#paper-cloud-glow)" />
            <ellipse cx="62" cy="12" rx="56" ry="34" fill="url(#paper-cloud-glow)" />
            <ellipse cx="-10" cy="-26" rx="44" ry="28" fill="url(#paper-cloud-glow)" />
          </g>
        </g>
      </svg>

      <style>{`
        .paper-cloud {
          filter: drop-shadow(0 6px 14px rgba(255, 182, 193, 0.35));
          transform-box: fill-box;
          transform-origin: center;
        }
        @media (prefers-reduced-motion: no-preference) {
          .paper-cloud-1 {
            animation: paper-cloud-drift 80s ease-in-out infinite alternate;
          }
          .paper-cloud-2 {
            animation: paper-cloud-drift-reverse 90s ease-in-out infinite alternate;
          }
        }
        @keyframes paper-cloud-drift {
          from { transform: translateX(-40px); }
          to   { transform: translateX(60px); }
        }
        @keyframes paper-cloud-drift-reverse {
          from { transform: translateX(40px); }
          to   { transform: translateX(-60px); }
        }
      `}</style>
    </div>
  )
}

export default memo(PaperBackground)
