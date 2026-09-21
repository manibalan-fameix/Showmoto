import type { CarAngle } from "@/lib/angles"

// Simple line-art guides. They tell the dealer where to stand and what to frame; they are not
// exact silhouettes. Each is drawn on a 240x160 canvas in the current text colour.

function Wheel({ cx, cy, r = 17 }: { cx: number; cy: number; r?: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} />
      <circle cx={cx} cy={cy} r={r * 0.45} />
    </>
  )
}

function Side() {
  return (
    <>
      <path d="M16 106 L16 90 Q16 82 28 80 L56 74 L80 50 Q86 44 98 44 L148 44 Q160 44 168 52 L188 76 L216 82 Q226 84 226 94 L226 106 Z" />
      <path d="M88 52 L82 74 L156 74 L140 52 Z M118 52 L118 74" />
      <Wheel cx={62} cy={108} />
      <Wheel cx={184} cy={108} />
      <path d="M8 128 L232 128" />
    </>
  )
}

function Corner({ rear }: { rear?: boolean }) {
  return (
    <>
      <path d={rear ? "M72 66 L88 38 L172 38 L190 66" : "M72 66 L98 40 L170 40 L192 66"} />
      <path d="M50 74 Q50 66 62 64 L196 64 Q208 66 208 74 L212 110 Q212 118 204 118 L56 118 Q48 118 48 110 Z" />
      <path d="M208 74 L232 84 L232 114 L212 110" />
      <rect x="58" y="76" width="30" height="12" rx="5" />
      <rect x="168" y="76" width="30" height="12" rx="5" />
      {rear ? <path d="M96 92 L164 92 L164 104 L96 104 Z M96 98 L164 98" /> : <path d="M96 90 L162 90 L162 106 L96 106 Z" />}
      <ellipse cx="72" cy="120" rx="14" ry="10" />
      <ellipse cx="190" cy="120" rx="14" ry="10" />
      <path d="M8 134 L232 134" />
    </>
  )
}

function Dashboard() {
  return (
    <>
      <path d="M10 66 L230 66 Q238 66 238 74 L238 88" />
      <circle cx="88" cy="100" r="38" />
      <circle cx="88" cy="100" r="10" />
      <path d="M50 100 L78 100 M98 100 L126 100 M88 110 L88 138" />
      <path d="M60 66 Q88 40 116 66" />
      <rect x="140" y="76" width="56" height="34" rx="4" />
      <circle cx="212" cy="82" r="6" />
      <circle cx="212" cy="98" r="6" />
    </>
  )
}

function Odometer() {
  return (
    <>
      <circle cx="120" cy="82" r="58" />
      <path d="M72 122 A58 58 0 0 1 168 122" />
      <path d="M120 82 L150 56" />
      <rect x="82" y="102" width="76" height="24" rx="3" />
      <path d="M94 106 L94 122 M108 106 L108 122 M122 106 L122 122 M136 106 L136 122 M150 106 L150 122" />
    </>
  )
}

function Seat({ x }: { x: number }) {
  return (
    <>
      <rect x={x + 22} y="20" width="32" height="18" rx="7" />
      <path d={`M${x + 8} 42 Q${x + 8} 36 ${x + 16} 36 L${x + 60} 36 Q${x + 68} 36 ${x + 68} 42 L${x + 66} 104 L${x + 10} 104 Z`} />
      <path d={`M${x + 4} 108 L${x + 72} 108 L${x + 78} 132 L${x - 2} 132 Z`} />
    </>
  )
}

function FrontSeats() {
  return (
    <>
      <Seat x={26} />
      <Seat x={136} />
    </>
  )
}

function RearSeats() {
  return (
    <>
      <rect x="34" y="18" width="40" height="18" rx="7" />
      <rect x="100" y="18" width="40" height="18" rx="7" />
      <rect x="166" y="18" width="40" height="18" rx="7" />
      <path d="M22 44 Q22 38 30 38 L210 38 Q218 38 218 44 L216 108 L24 108 Z" />
      <path d="M18 112 L222 112 L230 138 L10 138 Z" />
      <path d="M92 38 L92 108 M148 38 L148 108" />
    </>
  )
}

function Boot() {
  return (
    <>
      <path d="M32 54 L50 20 L190 20 L208 54" />
      <path d="M30 54 L210 54 L218 128 L22 128 Z" />
      <path d="M44 66 L196 66 L200 116 L40 116 Z" />
      <circle cx="120" cy="92" r="22" />
      <circle cx="120" cy="92" r="9" />
    </>
  )
}

function EngineBay() {
  return (
    <>
      <path d="M22 30 L218 30 L232 130 L8 130 Z" />
      <rect x="76" y="54" width="88" height="56" rx="5" />
      <path d="M90 54 L90 110 M104 54 L104 110 M118 54 L118 110 M132 54 L132 110 M146 54 L146 110" />
      <rect x="28" y="60" width="34" height="24" rx="3" />
      <circle cx="184" cy="66" r="10" />
      <path d="M164 84 L204 84 M164 96 L204 96" />
    </>
  )
}

function Tyre() {
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2
    const [x1, y1, x2, y2] = [120 + 58 * Math.cos(a), 84 + 58 * Math.sin(a), 120 + 66 * Math.cos(a), 84 + 66 * Math.sin(a)]
    return <path key={i} d={`M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`} />
  })
  const spokes = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2
    return <path key={i} d={`M120 84 L${(120 + 38 * Math.cos(a)).toFixed(1)} ${(84 + 38 * Math.sin(a)).toFixed(1)}`} />
  })
  return (
    <>
      <circle cx="120" cy="84" r="58" />
      <circle cx="120" cy="84" r="38" />
      <circle cx="120" cy="84" r="8" />
      {ticks}
      {spokes}
    </>
  )
}

export function AngleOutline({ angle, className }: { angle: CarAngle; className?: string }) {
  let art: React.ReactNode
  switch (angle) {
    case "front_three_quarter": art = <Corner />; break
    case "rear_three_quarter": art = <Corner rear />; break
    case "side_left": art = <Side />; break
    case "side_right": art = <g transform="translate(240 0) scale(-1 1)"><Side /></g>; break
    case "dashboard": art = <Dashboard />; break
    case "odometer": art = <Odometer />; break
    case "front_seats": art = <FrontSeats />; break
    case "rear_seats": art = <RearSeats />; break
    case "boot": art = <Boot />; break
    case "engine_bay": art = <EngineBay />; break
    case "tyres_front":
    case "tyres_rear": art = <Tyre />; break
  }
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {art}
    </svg>
  )
}
