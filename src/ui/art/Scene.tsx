import { phaseOf } from '../../core/realms.ts'

/**
 * 洞天圖 Six hunting grounds, drawn as places rather than as cards.
 *
 * The first attempt at these was six flat silhouettes at even intervals with hairline
 * strokes, and the verdict on them was correct: they were diagrams. A landscape is not
 * a set of shapes on a background, it is four things, and all six scenes below are built
 * from the same four.
 *
 *   A light. Dawn behind the far hills, a moon over still water, embers lighting a burnt
 *   wood from below, lightning standing inside a cloud, drowned light falling in shafts,
 *   and the rift itself. Everything else is a silhouette against it — the same grammar
 *   the cultivator's own portrait already uses.
 *
 *   Four planes, and the direction of their value ramp is the whole trick. Air is not
 *   clear: the further a mass sits, the more sky lies between you and it and the paler
 *   it goes. The first attempt had this backwards — the far bank was the darkest thing
 *   in the picture — which is why well-drawn shapes still read as cut-outs. `PLANE[0]`
 *   is at your feet and nearly black; `PLANE[3]` is at the horizon and nearly mist.
 *
 *   Mist between the planes. The one move all 山水 painting rests on.
 *
 *   A subject at known size. A mountain is only big beside something that is not, so
 *   every ground carries one small thing: the village under the Ash Slopes, the crane
 *   standing in the marsh, the doorway in the drowned gate.
 *
 * Each scene is about a kilobyte of inline SVG. No images, no library, and the light is
 * the 五行 phase of the realm that opens the ground — so the map is also a timeline of
 * the climb, greening at the bottom and turning to silver and storm at the top.
 */

/** At your feet, then back toward the horizon. Paler as it recedes, never darker. */
const PLANE = ['#030B08', '#071510', '#0E2219', '#1C3E30']

const W = 340
const H = 136

/** Every scene opens with the same lit sky and closes with the same haze. */
function Defs({ id, c }: { id: string; c: string }) {
  return (
    <defs>
      <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={c} stopOpacity=".24" />
        <stop offset="62%" stopColor={c} stopOpacity=".05" />
        <stop offset="100%" stopColor={c} stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`mist${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={c} stopOpacity="0" />
        <stop offset="50%" stopColor={c} stopOpacity=".17" />
        <stop offset="100%" stopColor={c} stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`glow${id}`}>
        <stop offset="0%" stopColor={c} stopOpacity=".5" />
        <stop offset="100%" stopColor={c} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`fog${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#05100D" stopOpacity="0" />
        <stop offset="45%" stopColor="#05100D" stopOpacity=".55" />
        <stop offset="100%" stopColor="#05100D" stopOpacity=".93" />
      </linearGradient>
    </defs>
  )
}

const Sky = ({ id }: { id: string }) => (
  <>
    <rect width={W} height={H} fill="#050E0B" />
    <rect width={W} height={H} fill={`url(#sky${id})`} />
  </>
)
const Mist = ({ id, y, h = 16 }: { id: string; y: number; h?: number }) => (
  <rect x="0" y={y} width={W} height={h} fill={`url(#mist${id})`} />
)

/** Deterministic scatter: the same ground draws the same picture on every device. */
const scrub = [[18, 4], [26, 6], [31, 3], [58, 5], [64, 7], [98, 4], [104, 6], [112, 4], [152, 6],
  [159, 4], [196, 5], [203, 7], [209, 4], [246, 5], [252, 3], [288, 6], [295, 4], [302, 7], [326, 5]]
const reeds = [[14, 30], [20, 44], [27, 36], [33, 52], [40, 38], [76, 34], [83, 48], [90, 40],
  [128, 42], [135, 30], [142, 50], [149, 36], [186, 46], [193, 34], [200, 54], [236, 38], [243, 50],
  [250, 32], [290, 44], [297, 36], [304, 52], [311, 30], [326, 40]]
const nearReeds = [[8, 56], [52, 64], [164, 58], [218, 68], [274, 54], [318, 62]]
const farTrunks = [[22, 44], [46, 52], [72, 38], [104, 58], [132, 46], [168, 62], [198, 42],
  [228, 54], [258, 40], [292, 50], [318, 44]]
const midTrunks = [[12, 66], [38, 50], [64, 74], [96, 58], [124, 80], [158, 54], [186, 70],
  [214, 46], [244, 76], [276, 56], [308, 68], [330, 52]]
const nearTrunks = [[26, 88], [44, 96], [52, 82], [118, 94], [130, 80], [138, 92], [206, 86],
  [218, 98], [262, 90], [272, 82], [300, 94]]
const embers = [[34, 112, 1.6], [52, 116, 1], [70, 110, 1.3], [96, 118, .9], [118, 113, 1.7],
  [140, 117, 1.1], [166, 111, 1.4], [190, 119, 1], [214, 114, 1.8], [240, 117, 1.2],
  [268, 112, 1.5], [296, 118, 1], [320, 114, 1.3]]
const shards = [[64, 22, 9], [100, 44, 6], [140, 18, 7], [276, 30, 8], [302, 60, 5], [46, 72, 6],
  [122, 84, 4], [300, 96, 4], [162, 40, 5], [258, 16, 5], [86, 104, 3], [334, 44, 4]]

type Painter = (id: string, c: string) => React.ReactNode

const SCENES: Record<string, Painter> = {
  /* 灰坡 — dawn behind the hills, a village on the middle slope, scrub underfoot. */
  ash: (id, c) => (
    <>
      <Sky id={id} />
      <circle cx="252" cy="40" r="66" fill={`url(#glow${id})`} />
      <path d="M0 62 Q34 42 66 54 Q94 63 120 45 Q152 24 188 46 Q222 66 254 48 Q290 28 340 50 L340 136 L0 136Z" fill={PLANE[3]} />
      <Mist id={id} y={50} h={22} />
      <path d="M0 80 Q40 64 88 76 Q134 86 180 72 Q232 56 286 74 Q314 83 340 76 L340 136 L0 136Z" fill={PLANE[2]} />
      <g opacity=".9">
        <path d="M236 76 l10 -8 10 8 v10 h-20Z" fill={PLANE[3]} />
        <path d="M254 78 l8 -7 8 7 v8 h-16Z" fill={PLANE[3]} />
        <path d="M233 69 h26 l-3 -4 h-20Z M251 72 h22 l-3 -4 h-16Z" fill={c} fillOpacity=".3" />
        <path d="M246 67 q3 -8 -1 -13 q4 -7 0 -12" stroke={c} strokeOpacity=".26" strokeWidth="1.2" fill="none" />
      </g>
      <Mist id={id} y={74} h={16} />
      <path d="M0 98 Q52 82 116 94 Q184 106 250 92 Q296 83 340 95 L340 136 L0 136Z" fill={PLANE[1]} />
      {scrub.map(([x, h], i) => (
        <path key={i} d={`M${x} ${106 - (i % 3)} q${(i % 3) - 1} -${h} ${(i % 4) - 1.5} -${h + 2}`}
              stroke={c} strokeOpacity={.22 + (i % 4) * .08} strokeWidth="1.1" fill="none" />
      ))}
      <path d="M0 112 Q70 104 150 111 Q230 118 340 108 L340 136 L0 136Z" fill={PLANE[0]} />
    </>
  ),

  /* 蘆沼 — a moon, its broken reflection, a crane for scale, reeds in clumps. */
  marsh: (id, c) => (
    <>
      <Sky id={id} />
      <circle cx="262" cy="32" r="46" fill={`url(#glow${id})`} />
      <circle cx="262" cy="32" r="13" fill={c} fillOpacity=".55" />
      <circle cx="258" cy="29" r="11" fill="#050E0B" fillOpacity=".35" />
      <path d="M0 72 Q60 66 130 70 Q210 74 340 68 L340 136 L0 136Z" fill={PLANE[3]} />
      <Mist id={id} y={62} h={22} />
      <path d="M0 84 H340 V136 H0Z" fill={PLANE[2]} />
      <path d="M0 84 H340" stroke={c} strokeOpacity=".3" strokeWidth="1" />
      {[[0, 26], [5, 20], [11, 24], [18, 14], [26, 18], [35, 10], [45, 14], [56, 8]].map(([o, w], i) => (
        <rect key={i} x={262 - w / 2} y={88 + o} width={w} height="1.4" rx=".7"
              fill={c} fillOpacity={.3 - o * .004} />
      ))}
      <g opacity=".85">
        <path d="M96 84 q1 -13 -4 -19 q-5 -6 1 -10 q5 -3 7 2" stroke={PLANE[0]} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M100 57 l6 2 l-6 2Z" fill={PLANE[0]} />
        <path d="M92 70 q8 -4 14 1 q-7 5 -14 -1Z" fill={PLANE[0]} />
        <path d="M96 84 l-1 8 M96 84 l3 8" stroke={PLANE[0]} strokeWidth="1.3" fill="none" />
      </g>
      <Mist id={id} y={78} h={14} />
      {reeds.map(([x, h], i) => {
        const lean = ((i * 7) % 9) - 4
        return (
          <g key={i} opacity={.55 + (i % 3) * .15}>
            <path d={`M${x} 88 q${lean / 2} -${h / 2} ${lean} -${h}`} stroke={c}
                  strokeOpacity={.3 + (i % 4) * .1} strokeWidth={1 + (i % 3) * .35} fill="none" />
            <path d={`M${x + lean} ${88 - h} l${lean > 0 ? 4 : -4} -3.5`} stroke={c}
                  strokeOpacity={.24 + (i % 4) * .08} strokeWidth="1" fill="none" />
          </g>
        )
      })}
      {nearReeds.map(([x, h], i) => {
        const lean = ((i * 5) % 11) - 5
        return <path key={i} d={`M${x} 136 q${lean / 2} -${h / 2} ${lean} -${h}`}
                     stroke={PLANE[0]} strokeWidth="2" fill="none" strokeLinecap="round" />
      })}
    </>
  ),

  /* 燼林 — lit from the ground up, which is what makes it the one you remember. */
  wood: (id, c) => (
    <>
      <Sky id={id} />
      <ellipse cx="172" cy="138" rx="126" ry="40" fill={`url(#glow${id})`} />
      <ellipse cx="172" cy="136" rx="62" ry="20" fill={`url(#glow${id})`} opacity=".9" />
      <ellipse cx="98" cy="138" rx="40" ry="14" fill={`url(#glow${id})`} opacity=".55" />
      <ellipse cx="252" cy="137" rx="46" ry="15" fill={`url(#glow${id})`} opacity=".6" />
      {farTrunks.map(([x, h], i) => (
        <path key={i} d={`M${x} 110 l${((i * 3) % 5) - 2} -${h}`} stroke={PLANE[3]}
              strokeWidth={2 + (i % 2)} fill="none" opacity={.5 + (i % 3) * .1} />
      ))}
      <Mist id={id} y={68} h={22} />
      {midTrunks.map(([x, h], i) => {
        const lean = ((i * 5) % 7) - 3
        const top = 112 - h
        return (
          <g key={i}>
            <path d={`M${x} 112 l${lean} -${h}`} stroke="#060E0A" strokeWidth={3 + (i % 3)} fill="none" strokeLinecap="round" />
            {i % 3 === 0 && <path d={`M${x + lean} ${top + 6} l${10 + i % 6} -${7 + i % 5}`} stroke="#060E0A" strokeWidth="2" fill="none" strokeLinecap="round" />}
            {i % 4 === 1 && <path d={`M${x + lean} ${top + 12} l-${9 + i % 5} -${5 + i % 4}`} stroke="#060E0A" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
          </g>
        )
      })}
      <path d="M0 112 Q80 106 172 111 Q250 115 340 108 L340 136 L0 136Z" fill={PLANE[1]} />
      {nearTrunks.map(([x, h], i) => (
        <path key={i} d={`M${x} 136 l${((i * 7) % 9) - 4} -${136 - h}`} stroke="#030806"
              strokeWidth={5 + (i % 3)} fill="none" strokeLinecap="round" />
      ))}
      {embers.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y + 12} r={r} fill={c} fillOpacity={.4 + (i % 4) * .14} />
      ))}
    </>
  ),

  /* 雷脊 — the fork stands inside the cloud, and the peak is off the centre line. */
  ridge: (id, c) => (
    <>
      <Sky id={id} />
      <circle cx="132" cy="30" r="60" fill={`url(#glow${id})`} />
      <path d="M0 46 Q30 30 70 36 Q104 41 132 28 Q166 13 202 30 Q238 46 274 34 Q308 23 340 38 L340 0 L0 0Z" fill={PLANE[3]} opacity=".6" />
      <path d="M138 8 l-16 30 h12 l-10 22 l30 -30 h-13 l14 -22Z" fill={c} fillOpacity=".9" />
      <path d="M124 16 l-9 24 l7 1 l-8 18 l18 -24 l-7 -1Z" fill={c} fillOpacity=".35" />
      <Mist id={id} y={40} h={22} />
      <path d="M0 136 L44 62 L74 84 L104 56 L132 40 L164 72 L196 50 L232 80 L268 54 L308 76 L340 58 L340 136Z" fill={PLANE[3]} />
      <Mist id={id} y={64} h={20} />
      <path d="M0 136 L36 86 L70 102 L106 76 L146 98 L184 70 L222 94 L262 74 L300 96 L340 80 L340 136Z" fill={PLANE[2]} />
      <Mist id={id} y={88} h={18} />
      <path d="M0 136 L52 104 L96 114 L142 98 L192 112 L242 100 L292 112 L340 102 L340 136Z" fill={PLANE[1]} />
      <path d="M0 136 L64 116 L128 122 L200 114 L270 120 L340 113 L340 136Z" fill={PLANE[0]} />
      <g opacity=".5">
        <path d="M96 78 l3 -5 l3 5Z M186 72 l2.5 -4 l2.5 4Z M264 76 l3 -5 l3 5Z" fill={c} />
      </g>
    </>
  ),

  /* 沉宮 — light falls in shafts, the gate is tilted, the doorway gives it scale. */
  palace: (id, c) => (
    <>
      <Sky id={id} />
      {[[36, 10], [92, 16], [158, 12], [226, 18], [292, 11]].map(([x, w], i) => (
        <path key={i} d={`M${x} 0 l${w} 0 l${w * 1.7 + 22} 136 l-${w * 1.2} 0Z`}
              fill={c} fillOpacity={.055 + (i % 3) * .02} />
      ))}
      <path d="M0 22 q42 -7 88 0 t92 0 t96 0 t64 0" stroke={c} strokeOpacity=".24" strokeWidth="1.2" fill="none" />
      <path d="M0 30 q50 -6 104 0 t108 0 t128 0" stroke={c} strokeOpacity=".14" strokeWidth="1" fill="none" />
      <Mist id={id} y={34} h={24} />
      <g transform="rotate(-3 170 90)">
        <path d="M96 62 q76 -13 152 0 l-13 7 h-126Z" fill={c} fillOpacity=".34" />
        <path d="M104 69 h136 l10 6 h-156Z" fill={PLANE[2]} />
        <path d="M86 63 q12 -6 20 -1 M254 63 q-12 -6 -20 -1" stroke={c} strokeOpacity=".3" strokeWidth="2.2" fill="none" />
        <path d="M114 75 h8 v61 h-8Z M148 75 h8 v61 h-8Z M186 75 h8 v61 h-8Z M220 75 h8 v61 h-8Z" fill={PLANE[1]} />
        <path d="M156 75 h34 v61 h-34Z" fill="#040B08" />
        <path d="M160 100 h26 v36 h-26Z" fill={c} fillOpacity=".16" />
        <path d="M104 75 h146 v4 h-146Z" fill={PLANE[0]} />
      </g>
      <Mist id={id} y={98} h={20} />
      <path d="M22 136 l6 -34 l7 34Z M46 136 l4 -22 l5 22Z M286 136 l7 -38 l6 38Z M312 136 l5 -24 l5 24Z" fill={PLANE[0]} />
      <path d="M0 126 Q70 118 152 124 Q238 130 340 120 L340 136 L0 136Z" fill={PLANE[0]} />
    </>
  ),

  /* 天裂 — the rift is the light, and the shards shrink as they fall toward it. */
  scar: (id, c) => (
    <>
      <Sky id={id} />
      <circle cx="214" cy="54" r="78" fill={`url(#glow${id})`} />
      <path d="M198 0 l16 26 l-10 6 l19 24 l-12 6 l15 30 l6 32 l-30 -34 l10 -6 l-20 -24 l11 -6 l-15 -22 l10 -6 Z" fill={c} fillOpacity=".92" />
      <path d="M186 0 l10 30 l-7 5 l12 26 l-22 -26 l7 -5 Z" fill={c} fillOpacity=".3" />
      <path d="M226 6 l-8 26 l6 4 l-10 24 l20 -26 l-6 -4 Z" fill={c} fillOpacity=".22" />
      <Mist id={id} y={52} h={26} />
      {shards.map(([x, y, s], i) => (
        <g key={i} transform={`rotate(${(i * 37) % 360} ${x} ${y})`}>
          <path d={`M${x} ${y} l${s} ${s * .5} l-${s * .4} ${s} l-${s * .9} -${s * .3}Z`}
                fill={PLANE[1]} opacity={.5 + (i % 4) * .12} />
        </g>
      ))}
      <path d="M0 136 L38 102 L86 116 L140 98 L190 114 L246 100 L300 116 L340 104 L340 136Z" fill={PLANE[2]} />
      <Mist id={id} y={106} h={16} />
      <path d="M0 136 L54 120 L118 130 L188 118 L262 128 L340 116 L340 136Z" fill={PLANE[0]} />
      <path d="M150 136 l10 -16 l6 16Z M206 136 l8 -20 l7 20Z" fill={PLANE[0]} />
    </>
  ),
}

export function hasScene(id: string): boolean {
  return id in SCENES
}

/**
 * One ground's vignette. `realm` is the realm that opens it, which decides the light:
 * the map is also a timeline of the climb, greening at the bottom and turning to storm
 * and silver at the top. `fogged` paints a shut ground out from below rather than
 * greying the whole row — you can still see there is something down there, which is a
 * better invitation than a disabled list item.
 */
export function Scene({ id, realm, fogged = false }: { id: string; realm: number; fogged?: boolean }) {
  const paint = SCENES[id]
  if (!paint) return null
  const c = `var(--${phaseOf(realm)}-mid)`
  return (
    <svg className="scene" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <Defs id={id} c={c} />
      {paint(id, c)}
      {fogged && <rect width={W} height={H} fill={`url(#fog${id})`} />}
    </svg>
  )
}
