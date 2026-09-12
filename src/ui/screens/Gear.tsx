import { useState } from 'react'
import { Glyph } from '../art/Glyph.tsx'
import { Lore } from '../Lore.tsx'
import { RELICS, SLOTS, SLOT_NAME, owns, relic, type Slot } from '../../core/relics.ts'
import {
  PATTERNS, TEMPER_MAX, canTemper, costToMax, effectText as forgeText,
  levelOf, made, pattern, temperCost,
} from '../../core/forge.ts'
import { WARDENS } from '../../core/wardens.ts'
import { MATERIALS, count } from '../../core/materials.ts'
import type { PlayerState } from '../../core/state.ts'

/**
 * 身上 What you are wearing, and what else would fit.
 *
 * This screen used to render twenty-eight cards across six unrelated sections: three
 * slots, nine forge patterns, seven relics, three pills and six wardens. Twenty-five of
 * those twenty-eight were things the player could not act on — patterns they could not
 * afford, relics they did not own, bosses they had not met — so the screen answered
 * "everything that exists" when the only question it is ever asked is "what goes in this
 * slot". Worse, the two things that actually compete for a slot sat four hundred pixels
 * and two section headings apart, which made the comparison the screen exists for
 * literally impossible to perform.
 *
 * So: three slots, and one drawer. Tap a slot and you get what fits it — forged and
 * found in one list, each with what it would give you — and the forge sits on the row
 * next to the thing it improves rather than in a section of its own. Anything you cannot
 * act on collapses to a single line at the bottom.
 *
 * Two sections left the tab entirely rather than being deleted. Pills are consumables
 * brewed from the satchel, so they went to the Body with the rest of what-you-are.
 * Wardens live under a hunting ground, so they went into that ground's card on the Hunt
 * screen — where six of them were already being listed a second time.
 */
const MAT_GLYPH: Record<string, string> = { hide: 'g-stone', core: 'g-cauldron', essence: 'g-talisman' }

function Levels({ level }: { level: number }) {
  return (
    <span className="pipsm" aria-label={`Tempered ${level} of ${TEMPER_MAX}`}>
      {Array.from({ length: TEMPER_MAX }, (_, i) => (
        <i key={i} className={i < level ? 'on' : ''} />
      ))}
    </span>
  )
}

export function Gear({ state, onWear, onTemper }: {
  state: PlayerState
  onWear: (id: string | null, slot: Slot) => void
  onTemper: (id: string) => void
}) {
  const [slot, setSlot] = useState<Slot>('implement')

  /* What fits this slot, split by whether it is any use to you today. */
  const forged = PATTERNS.filter((p) => p.slot === slot)
  const relics = RELICS.filter((r) => r.slot === slot)
  const live = [
    ...forged.filter((p) => state.realm >= p.realm),
    ...relics.filter((r) => owns(state, r.id)),
  ]
  const away = [
    ...forged.filter((p) => state.realm < p.realm).map((p) => ({ name: p.name, why: `realm ${p.realm}` })),
    ...relics.filter((r) => !owns(state, r.id)).map((r) => ({
      name: r.name,
      why: WARDENS.find((w) => w.id === r.from)?.name ?? 'unclaimed',
    })),
  ]

  return (
    <div className="screen">
      <p className="label">Worn <span className="han">身上</span></p>
      <div className="slots">
        {SLOTS.map((k) => {
          const id = state.wearing[k]
          const r = id ? relic(id) : undefined
          const f = id ? pattern(id) : undefined
          const lv = f ? levelOf(state.forged, f.id) : 0
          return (
            <button key={k} className={`slot${slot === k ? ' sel' : ''}${r || f ? ' filled' : ' empty'}`}
                    aria-pressed={slot === k} onClick={() => setSlot(k)}>
              <span className="sk han">{SLOT_NAME[k].zh}</span>
              {r ? <Glyph symbol={r.glyph} size={24} />
                 : f ? <Glyph symbol={f.glyph} size={24} />
                     : <span className="empty">—</span>}
              <span className="sn">{r ? r.name : f ? f.name : SLOT_NAME[k].name}</span>
              <span className="se">{r ? r.text : f ? forgeText(f, lv) : 'nothing'}</span>
              <span className="sz">{f ? `level ${lv}` : r ? 'relic' : 'empty'}</span>
            </button>
          )
        })}
      </div>

      {/* One drawer, showing only what fits the slot you tapped. */}
      <div className="drawer">
        <div className="dh">
          <span className="han">{SLOT_NAME[slot].zh}</span>
          <b>{SLOT_NAME[slot].name}</b>
          <span className="cnt">{live.length} you can wear</span>
        </div>

        {live.map((item) => {
          const isForge = 'per' in item
          const id = item.id
          const on = state.wearing[slot] === id
          const p = isForge ? (item as (typeof PATTERNS)[number]) : null
          const r = isForge ? null : (item as (typeof RELICS)[number])
          const lv = p ? levelOf(state.forged, p.id) : 0
          const maxed = lv >= TEMPER_MAX
          const cost = p && !maxed ? (temperCost(p, lv)[p.mat] ?? 0) : 0
          const can = p ? canTemper(state, p.id) : false
          const w = r ? WARDENS.find((x) => x.id === r.from) : undefined

          return (
            <div className={`opt${on ? ' worn' : ''}`} key={id}>
              <span className="oi"><Glyph symbol={p ? p.glyph : r!.glyph} size={22} /></span>
              <span className="ob">
                <span className="on">
                  {p ? p.name : r!.name} <span className="han dim-han">{p ? p.zh : r!.zh}</span>
                </span>
                <span className="ceff">
                  {p ? (lv > 0 ? forgeText(p, lv) : 'not forged yet') : r!.text}
                </span>
                {p ? (
                  <>
                    <span className="forgerow">
                      <Levels level={lv} />
                      <span className="cnum">
                        {maxed ? 'at the ceiling'
                          : <>{lv === 0 ? 'forge' : `level ${lv + 1}`} · <b>{cost}</b> {p.mat}</>}
                      </span>
                    </span>
                    {lv > 0 && !maxed && (
                      <span className="cnum">
                        at {TEMPER_MAX} · {forgeText(p, TEMPER_MAX)} · <b>{costToMax(p, lv)}</b> more
                      </span>
                    )}
                  </>
                ) : (
                  <span className="cnum">relic · off the {w?.name ?? 'warden'}</span>
                )}
                <Lore>{p ? p.note : r!.note}</Lore>
              </span>
              <span className="acts">
                {(!p || made(state, p.id)) && (
                  <button className={`mini${on ? ' on' : ''}`} onClick={() => onWear(on ? null : id, slot)}>
                    {on ? 'worn' : 'put on'}
                  </button>
                )}
                {p && <button className="mini" onClick={() => onTemper(p.id)} disabled={!can}>
                  {maxed ? 'done' : lv === 0 ? 'forge' : 'temper'}
                </button>}
              </span>
            </div>
          )
        })}

        {away.length > 0 && (
          <p className="notyet">
            Not yet: {away.map((a, i) => (
              <span key={a.name}>{i > 0 && '  ·  '}{a.name} <span className="dim">{a.why}</span></span>
            ))}
          </p>
        )}
      </div>

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
    </div>
  )
}
