import { Glyph } from '../art/Glyph.tsx'
import { TECHNIQUES, SCHOOL_NAME, effectText, slotsAt, schoolClash, upkeepOf } from '../../core/techniques.ts'
import { modifiers } from '../../core/progress.ts'
import { levelOf, refineCost, valueAt, canRefine, MASTERY_MAX } from '../../core/mastery.ts'
import { short } from '../../core/format.ts'
import type { PlayerState } from '../../core/state.ts'

/**
 * 功法. What you know, what you are running, and what you have poured into it.
 *
 * The screen used to answer one question — learn or equip — and the answer stopped
 * mattering the moment a player could afford everything. Mastery is the third column:
 * an art you have refined five times is worth twice the one beside it, so the six in
 * your slots stop being a shortlist and start being a decision you keep paying for.
 */
function Pips({ level }: { level: number }) {
  return (
    <span className="pipsm" aria-label={`Mastery ${level} of ${MASTERY_MAX}`}>
      {Array.from({ length: MASTERY_MAX }, (_, i) => (
        <i key={i} className={i < level ? 'on' : ''} />
      ))}
    </span>
  )
}

export function Arts({ state, onLearn, onEquip, onUnequip, onRefine }: {
  state: PlayerState
  onLearn: (id: string) => void
  onEquip: (id: string) => void
  onUnequip: (id: string) => void
  onRefine: (id: string) => void
}) {
  const slots = slotsAt(state.realm)
  const equipped = state.equipped
  const upkeep = modifiers(state).upkeep

  return (
    <div className="screen">
      <p className="label">Arts <span className="han">功法</span></p>

      <div className="panel">
        <div className="row">
          <span className="k">Slots filled</span>
          <span className="v num">{equipped.length} / {slots}</span>
        </div>
        <div className="row">
          <span className="k">Total upkeep</span>
          <span className="v num crimson">−{short(upkeep)} qi/s</span>
        </div>
        <div className="row">
          <span className="k">Insight unspent</span>
          <span className="v num jade">{state.insight}</span>
        </div>
        {equipped.length === 0 && (
          <p className="hint">
            Nothing equipped. A learned art does nothing until it sits in a slot, and every
            slot filled costs qi per second — so a full bar is rarely the right bar.
          </p>
        )}
      </div>

      <p className="label">All arts · {state.learned.length} of {TECHNIQUES.length} known</p>
      <div className="list">
        {TECHNIQUES.map((t) => {
          const known = state.learned.includes(t.id)
          const on = equipped.includes(t.id)
          const locked = state.realm < t.realm
          const full = equipped.length >= slots
          const level = levelOf(state.mastery, t.id)
          const clash = !on ? schoolClash(equipped, t) : undefined

          let action: string
          let disabled = false
          let click = () => {}
          if (locked) { action = `realm ${t.realm}`; disabled = true }
          else if (!known) {
            action = `learn · ${t.cost}`
            disabled = state.insight < t.cost
            click = () => onLearn(t.id)
          } else if (on) { action = 'equipped'; click = () => onUnequip(t.id) }
          else if (clash) { action = `${SCHOOL_NAME[t.school]} taken`; disabled = true }
          else if (full) { action = 'no slot'; disabled = true }
          else { action = 'equip'; click = () => onEquip(t.id) }

          const refinable = canRefine(state, t.id)
          const maxed = level >= MASTERY_MAX

          return (
            <div key={t.id} className={`art${locked ? ' locked' : ''}${on ? ' on' : ''}`}>
              <button className="artmain" onClick={click} disabled={disabled}
                      aria-label={`${t.name}. ${effectText(t, valueAt(t, level))}. ${action}`}>
                <Glyph symbol={t.glyph} />
                <span className="cb">
                  <span className="cn">{t.name} <span className="han dim-han">{t.zh}</span></span>
                  <span className="cd">{effectText(t, valueAt(t, level))}</span>
                  <span className="cd dim">
                    {SCHOOL_NAME[t.school]} school · −{short(upkeepOf(t))} qi/s upkeep
                  </span>
                </span>
                <span className={`cx${disabled ? ' dim' : ''}`}>{action}</span>
              </button>
              {known && (
                <div className="artfoot">
                  <Pips level={level} />
                  <span className="artnote">
                    {maxed
                      ? 'fully mastered'
                      : `next level · ${effectText(t, valueAt(t, level + 1))}`}
                  </span>
                  <button className={`mini${refinable ? ' on' : ''}`} disabled={!refinable}
                          onClick={() => onRefine(t.id)}>
                    {maxed ? '—' : `refine · ${refineCost(t, level)}`}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="hint centered">
        Refining raises what an art gives and never what it costs to carry. It is the only
        thing insight buys that cannot be undone, so spend it on the arts you mean to keep.
      </p>
    </div>
  )
}
