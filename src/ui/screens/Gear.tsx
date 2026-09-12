import { Glyph } from '../art/Glyph.tsx'
import { Lore } from '../Lore.tsx'
import { RELICS, SLOTS, SLOT_NAME, owns, relic, type Slot } from '../../core/relics.ts'
import {
  PATTERNS, TEMPER_MAX, canTemper, costToMax, effectText as forgeText,
  levelOf, made, pattern, temperCost,
} from '../../core/forge.ts'
import { WARDENS } from '../../core/wardens.ts'
import { MATERIALS, count, type MaterialId } from '../../core/materials.ts'
import { PILLS, brewable, held } from '../../core/pills.ts'
import type { PillId } from '../../core/pills.ts'
import type { PlayerState } from '../../core/state.ts'

/**
 * 行囊 What you are carrying, what you have made of it, and what of it you have put on.
 *
 * Its own screen, deliberately apart from Arts, because the two systems are opposites
 * and sitting them together blurs both. An art is knowledge: bought with insight, six
 * at a time, costing qi every second to hold. An object is an object: paid for out of
 * a satchel you filled by going out, free to carry once made, and yours.
 *
 * Two kinds of object share the same three slots, which is where the decision lives:
 *
 *   Forged. Nine patterns, nine levels each, bought with beast materials and nothing
 *   else. This is the only gear in the game that touches generation, and it is the
 *   reason the satchel has a bottom — a player used to come home with eight hundred
 *   hides across a climb and spend sixty-four of them.
 *   Found. Seven relics, one to a warden, taken once and never improved. They do
 *   things the forge cannot: hold more hunts, halve what a failed tribulation costs,
 *   make the world happen to you more often.
 *
 * So the question on this screen is never "which is better" in the abstract. It is
 * "is my level-seven Stormcore Seal worth more to me this week than the Drowned Bell",
 * and the answer changes as the levels climb.
 */
const MAT_GLYPH: Record<string, string> = { hide: 'g-stone', core: 'g-cauldron', essence: 'g-talisman' }

/** Three tiers, and the note is four words because a tier header is a signpost. */
const TIERS: { mat: MaterialId; name: string; zh: string; note: string }[] = [
  { mat: 'hide',    name: 'Hide work',    zh: '皮',   note: 'Cheap, and hide is everywhere' },
  { mat: 'core',    name: 'Core work',    zh: '丹',   note: 'The heaviest patterns' },
  { mat: 'essence', name: 'Essence work', zh: '真元', note: 'Few levels, each enormous' },
]

function Levels({ level }: { level: number }) {
  return (
    <span className="pipsm" aria-label={`Tempered ${level} of ${TEMPER_MAX}`}>
      {Array.from({ length: TEMPER_MAX }, (_, i) => (
        <i key={i} className={i < level ? 'on' : ''} />
      ))}
    </span>
  )
}

export function Gear({ state, onWear, onTemper, onBrew, onTakePill }: {
  state: PlayerState
  onWear: (id: string | null, slot: Slot) => void
  onTemper: (id: string) => void
  onBrew: (id: PillId) => void
  onTakePill: (id: PillId) => void
}) {
  const forgedCount = PATTERNS.filter((p) => made(state, p.id)).length

  return (
    <div className="screen">
      <p className="label">Worn <span className="han">身上</span></p>
      <div className="slots">
        {SLOTS.map((slot) => {
          const id = state.wearing[slot]
          const r = id ? relic(id) : undefined
          const f = id ? pattern(id) : undefined
          const lv = f ? levelOf(state.forged, f.id) : 0
          return (
            <div key={slot} className={`slot${r || f ? ' filled' : ''}`}>
              <span className="sk han">{SLOT_NAME[slot].zh}</span>
              {r ? <Glyph symbol={r.glyph} size={26} />
                 : f ? <Glyph symbol={f.glyph} size={26} />
                     : <span className="empty">—</span>}
              <span className="sn">{r ? r.name : f ? `${f.name} · ${lv}` : SLOT_NAME[slot].name}</span>
            </div>
          )
        })}
      </div>
      <p className="hint">Forged and found share these three slots. Changeable whenever you like.</p>

      {/* The forge first. It is the reason this screen exists and the only place in the
          game where a full satchel turns into generation. */}
      <p className="label">The forge <span className="han">鍛</span> · {forgedCount} of {PATTERNS.length} made</p>
      <p className="hint" style={{ marginBottom: 10 }}>
        Paid in materials, never insight. Nine levels, each dearer than the last.
      </p>

      {TIERS.map((tier) => {
        const pool = PATTERNS.filter((p) => p.mat === tier.mat)
        const have = count(state.satchel, tier.mat)
        return (
          <div key={tier.mat}>
            <p className="label sub">
              {tier.name} <span className="han">{tier.zh}</span>
              <span className="num dim"> · {have} in the satchel</span>
            </p>
            <p className="hint" style={{ marginBottom: 8 }}>{tier.note}.</p>
            <div className="list">
              {pool.map((p) => {
                const lv = levelOf(state.forged, p.id)
                const maxed = lv >= TEMPER_MAX
                const cost = maxed ? 0 : (temperCost(p, lv)[p.mat] ?? 0)
                const can = canTemper(state, p.id)
                const locked = state.realm < p.realm
                const on = state.wearing[p.slot] === p.id
                return (
                  <div key={p.id} className={`card artmain${on ? ' on' : ''}${locked ? ' locked' : ''}`}>
                    <Glyph symbol={p.glyph} size={26} />
                    <span className="cb">
                      <span className="cn">
                        {p.name} <span className="han dim-han">{p.zh}</span>
                      </span>
                      {/* What you are choosing between, at the top and in the realm's light. */}
                      <span className="ceff">
                        {lv > 0 ? forgeText(p, lv) : locked ? `Known at realm ${p.realm}` : 'Not forged yet'}
                      </span>
                      <span className="forgerow">
                        <Levels level={lv} />
                        {/* What it costs, in figures rather than in a sentence. */}
                        <span className="cnum">
                          {maxed ? 'at the ceiling'
                                 : <>{lv === 0 ? 'forge' : `→ ${lv + 1}`} · <b>{cost}</b> {p.mat}</>}
                        </span>
                      </span>
                      {lv > 0 && !maxed && (
                        <span className="cnum">
                          at {TEMPER_MAX} · {forgeText(p, TEMPER_MAX).replace(/^(\+|−)?/, '$1')} · <b>{costToMax(p, lv)}</b> more
                        </span>
                      )}
                      <Lore>{SLOT_NAME[p.slot].name} · {p.note}</Lore>
                    </span>
                    <span className="pillcol">
                      <button className="mini" onClick={() => onTemper(p.id)} disabled={!can}>
                        {maxed ? 'done' : lv === 0 ? 'forge' : 'temper'}
                      </button>
                      {lv > 0 && (
                        <button className={`mini${on ? ' on' : ''}`}
                                onClick={() => onWear(on ? null : p.id, p.slot)}>
                          {on ? 'worn' : 'put on'}
                        </button>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <p className="label">Satchel <span className="han">行囊</span></p>
      <div className="matrow">
        {MATERIALS.map((mt) => (
          <div className="mat" key={mt.id}>
            <Glyph symbol={MAT_GLYPH[mt.id]} size={22} />
            <span className="mn">{mt.name}</span>
            <span className="mv num">{count(state.satchel, mt.id)}</span>
          </div>
        ))}
      </div>
      <p className="hint">Hunting raises these. Waiting never does.</p>

      <p className="label">Relics taken <span className="han">法寶</span> · {state.relics.length} of {RELICS.length}</p>
      <p className="hint" style={{ marginBottom: 8 }}>
        One to a warden, never improved. They bend a rule rather than raise a number.
      </p>
      {SLOTS.map((slot) => (
        <div key={slot}>
          <p className="label sub">{SLOT_NAME[slot].name} <span className="han">{SLOT_NAME[slot].zh}</span></p>
          <div className="list">
            {RELICS.filter((r) => r.slot === slot).map((r) => {
              const have = owns(state, r.id)
              const on = state.wearing[slot] === r.id
              const w = WARDENS.find((x) => x.id === r.from)
              return (
                <button
                  key={r.id}
                  className={`card${on ? ' on' : ''}${have ? '' : ' locked'}`}
                  disabled={!have}
                  onClick={() => onWear(on ? null : r.id, slot)}
                >
                  <Glyph symbol={r.glyph} size={26} />
                  <span className="cb">
                    <span className="cn">{r.name} <span className="han dim-han">{r.zh}</span></span>
                    <span className="ceff">{have ? r.text : `Taken from ${w?.name ?? 'a warden'}`}</span>
                    <Lore>{have ? r.note : `${w?.zh ?? ''} · not yet beaten`}</Lore>
                  </span>
                  <span className={`cx${have ? '' : ' dim'}`}>
                    {on ? 'worn' : have ? 'put on' : 'unclaimed'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

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
                <span className="ceff">{p.text}</span>
                <span className="cnum">{costText}</span>
              </span>
              <span className="pillcol">
                {have > 0 && (
                  <button className="mini on" onClick={() => onTakePill(p.id)}
                          disabled={p.id === 'tribulation' && state.pillPrimed}>
                    {p.id === 'tribulation' && state.pillPrimed ? 'primed' : `take (${have})`}
                  </button>
                )}
                <button className="mini" onClick={() => onBrew(p.id)} disabled={!can}>brew</button>
              </span>
            </div>
          )
        })}
      </div>

      <p className="label">Wardens put down · {state.wardens.length} of {WARDENS.length}</p>
      <div className="list">
        {WARDENS.map((w) => {
          const done = state.wardens.includes(w.id)
          const r = relic(w.relic)!
          return (
            <div className={`card${done ? ' on' : ' locked'}`} key={w.id}>
              <span className="cb">
                <span className="cn">{done ? w.name : '???'} <span className="han dim-han">{done ? w.zh : ''}</span></span>
                <span className="cd">{done ? r.name : 'Somewhere under a hunting ground'}</span>
              </span>
              <span className={`cx${done ? '' : ' dim'}`}>{done ? 'taken' : 'standing'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
