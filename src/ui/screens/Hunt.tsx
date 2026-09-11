import { Figure } from '../art/Figure.tsx'
import { Glyph } from '../art/Glyph.tsx'
import { BEASTS } from '../../core/beasts.ts'
import { MATERIALS, count } from '../../core/materials.ts'
import { PILLS, brewable, held } from '../../core/pills.ts'
import type { PillId } from '../../core/pills.ts'
import { canHunt, huntCost, huntCharges, nextChargeAt, quarry, HUNT_MAX_CHARGES } from '../../core/hunt.ts'
import { GROUNDS, ground, openAt, quarryOf, groundOf } from '../../core/grounds.ts'
import { TURMOIL_MAX } from '../../core/progress.ts'
import { ratePerSecond } from '../../core/progress.ts'
import { duration, short } from '../../core/format.ts'
import type { PlayerState } from '../../core/state.ts'

/**
 * 狩 The hunt, and everything that comes back from it.
 *
 * This screen used to be called Sect and held seven unrelated things — the hunt, the
 * satchel, the pills, the ladder of realms, the heavenly flames, the bestiary and the
 * button that deletes your character. A tab has to answer one question, and this one
 * answers "what do I go out and get?": take a beast, carry the materials home, burn
 * them into pills. The flames went to the Body, the ladder to Cultivate, and the
 * cultivator's own record to the hall where the rest of the line is kept.
 */
const RANK_TIER: Record<number, [string, string, string]> = {
  1: ['#4A1E08', '#7C3411', '#A65A22'],
  2: ['#8B3D10', '#D0741C', '#F0B25C'],
  3: ['#C06A1E', '#FCE2AA', '#FFFBEE'],
}
const MAT_GLYPH: Record<string, string> = { hide: 'g-stone', core: 'g-cauldron', essence: 'g-talisman' }

export function Hunt({ state, now, onHunt, onTravel, onBrew, onTakePill }: {
  state: PlayerState
  now: number
  onHunt: () => void
  onTravel: (id: string) => void
  onBrew: (id: PillId) => void
  onTakePill: (id: PillId) => void
}) {
  const ready = canHunt(state, now)
  const charges = huntCharges(state, now)
  const nextAt = nextChargeAt(state, now)
  const waiting = nextAt ? Math.max(0, nextAt - now) / 1000 : 0
  const broke = charges > 0 && state.qi < huntCost(state)
  const pool = quarry(state)
  const here = ground(state.ground)
  // "Needs 150 qi" on a fresh save is a dead end unless it also says how long that is.
  const rate = ratePerSecond(state, now)
  const untilAfford = rate > 0 ? (huntCost(state) - state.qi) / rate : Infinity

  return (
    <div className="screen">
      <p className="label">Hunting grounds <span className="han">洞天</span></p>
      <p className="hint">
        Each ground holds three beasts and therefore leans toward one material, and each
        stirs the heart every time you hunt there. Going deeper is not about being strong
        enough — it is about what you can afford to pay in calm before the next tribulation.
      </p>
      <div className="list">
        {GROUNDS.map((g) => {
          const open = openAt(g, state.realm)
          const on = g.id === here.id
          const found = quarryOf(g).filter((b) => state.seenBeasts.includes(b.id)).length
          // "up to Spirit Core" was the same sentence for three different grounds.
          // What actually separates the Reed Marsh from Thunder Ridge is the mix —
          // two hides and a core against three cores — so show the mix.
          const mix = MATERIALS
            .map((m) => [m, quarryOf(g).filter((b) => b.rank === m.rank).length] as const)
            .filter(([, n]) => n > 0)
            .map(([m, n]) => `${n}× ${m.name}`)
            .join(', ')
          return (
            <button key={g.id} className={`card${on ? ' on' : ''}${open ? '' : ' locked'}`}
                    disabled={!open || on} onClick={() => onTravel(g.id)}>
              <span className="cb">
                <span className="cn">{g.name} <span className="han dim-han">{g.zh}</span></span>
                <span className="cd">{g.note}</span>
                <span className="cd dim">
                  {open
                    ? `${mix} · ${g.danger === 0 ? 'no turmoil' : `+${g.danger} turmoil a hunt`}` +
                      `${g.bonus ? ` · +${g.bonus} to every haul` : ''} · ${found}/3 recorded`
                    : `opens at realm ${g.realm}`}
                </span>
              </span>
              <span className={`cx${on ? '' : ' dim'}`}>{on ? 'here' : open ? 'travel' : 'shut'}</span>
            </button>
          )
        })}
      </div>

      <p className="label">The hunt <span className="han">狩</span></p>

      <div className="panel">
        <div className="charges" aria-label={`${charges} of ${HUNT_MAX_CHARGES} hunts held`}>
          {Array.from({ length: HUNT_MAX_CHARGES }, (_, i) => (
            <i key={i} className={i < charges ? 'on' : ''} />
          ))}
        </div>
        <div className="row">
          <span className="k">Hunts held</span>
          <span className="v num">{charges} of {HUNT_MAX_CHARGES}</span>
        </div>
        <div className="row">
          <span className="k">Cost of one</span>
          <span className="v num">{short(huntCost(state))} qi</span>
        </div>
        {waiting > 0 && (
          <div className="row">
            <span className="k">Next returns in</span>
            <span className="v num dim">{duration(waiting)}</span>
          </div>
        )}
        <div className="row">
          <span className="k">Standing in</span>
          <span className="v">{here.name} <span className="han">{here.zh}</span></span>
        </div>
        <div className="row">
          <span className="k">Costs in calm</span>
          <span className={`v num${here.danger > 0 ? '' : ' dim'}`}>
            {here.danger > 0 ? `+${here.danger} turmoil` : 'nothing'}
          </span>
        </div>
        <div className="row">
          <span className="k">Quarry here</span>
          <span className="v num dim">{pool.map((b) => b.name.split(' ').slice(-1)[0]).join(' · ')}</span>
        </div>
        <button className="cta" onClick={onHunt} disabled={!ready}>
          {ready ? 'Hunt'
            : broke ? `Needs ${short(huntCost(state) - state.qi)} more qi · ${duration(untilAfford)}`
            : waiting > 0 ? `No hunts held · next in ${duration(waiting)}`
            : 'Nothing to hunt yet'}
        </button>
        {here.danger > 0 && state.turmoil + here.danger > TURMOIL_MAX * 0.5 && (
          <p className="hint warnline">
            Your heart is at {Math.round(state.turmoil)}. Four trips here put it at{' '}
            {Math.min(TURMOIL_MAX, Math.round(state.turmoil + here.danger * 4))}.
          </p>
        )}
        <p className="hint">
          A hunt costs five minutes of gathering and returns materials and insight —
          the two things meridians are bought with. Charges come back on their own
          whether the app is open or not and stop at {HUNT_MAX_CHARGES}, so checking in
          five times an evening earns no more than checking in once.
        </p>
      </div>

      <p className="label">Satchel</p>
      <div className="matrow">
        {MATERIALS.map((mt) => (
          <div className="mat" key={mt.id}>
            <Glyph symbol={MAT_GLYPH[mt.id]} size={22} />
            <span className="mn">{mt.name}</span>
            <span className="mv num">{count(state.satchel, mt.id)}</span>
          </div>
        ))}
      </div>

      <p className="label">The cauldron <span className="han">丹</span></p>
      <div className="list">
        {PILLS.map((p) => {
          const have = held(state.pills, p.id)
          const can = brewable(state.satchel, p)
          const costText = Object.entries(p.cost).map(([k, v]) => `${v}× ${k}`).join(' + ')
          return (
            <div className="card" key={p.id}>
              <span className="cb">
                <span className="cn">{p.name} <span className="han dim-han">{p.zh}</span></span>
                <span className="cd">{p.text}</span>
                <span className="cd dim">{costText}</span>
              </span>
              <span className="pillcol">
                {have > 0 && (
                  <button
                    className="mini on"
                    onClick={() => onTakePill(p.id)}
                    disabled={p.id === 'tribulation' && state.pillPrimed}
                  >
                    {p.id === 'tribulation' && state.pillPrimed ? 'primed' : `take (${have})`}
                  </button>
                )}
                <button className="mini" onClick={() => onBrew(p.id)} disabled={!can}>brew</button>
              </span>
            </div>
          )
        })}
      </div>
      <p className="hint">
        Pills and meridians draw on the same satchel. Brewing one you will not swallow
        is a channel you do not open.
      </p>

      <p className="label">Bestiary · {state.seenBeasts.length} of {BEASTS.length} taken</p>
      <div className="grid">
        {BEASTS.map((b) => {
          const seen = state.seenBeasts.includes(b.id)
          const g = groundOf(b.id)
          const reachable = !!g && openAt(g, state.realm)
          const [lo, mid, hi] = RANK_TIER[b.rank]
          return (
            <div className="beast" key={b.id} title={seen ? b.note : `Found in ${g?.name ?? 'the wilds'}`}>
              <div style={seen ? { ['--flame-lo' as string]: lo, ['--flame-mid' as string]: mid, ['--flame-hi' as string]: hi } : undefined}>
                <Figure symbol={b.symbol} size={72} dim={!seen} label={seen ? `${b.name}. ${b.note}` : undefined} />
              </div>
              <span className="bn" style={seen ? undefined : { color: 'var(--stone)' }}>{seen ? b.name : '???'}</span>
              <span className="bz han">{seen ? b.zh : '—'}</span>
              <span className="brk">{seen ? MATERIALS[b.rank - 1].name : reachable ? groundOf(b.id)?.name ?? '' : `realm ${groundOf(b.id)?.realm ?? 1}`}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
