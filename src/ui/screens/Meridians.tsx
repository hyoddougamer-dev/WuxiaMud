import { Glyph } from '../art/Glyph.tsx'
import { COURSE_NAME, courseOf, type Course, type Meridian } from '../../core/meridians.ts'
import { meridiansAt } from '../../core/progress.ts'
import { MATERIALS, count } from '../../core/materials.ts'
import type { MaterialId } from '../../core/materials.ts'
import type { PlayerState } from '../../core/state.ts'

const MAT_GLYPH: Record<string, string> = { hide: 'g-stone', core: 'g-cauldron', essence: 'g-talisman' }
const COURSES: Course[] = ['hand', 'foot', 'extra']

function price(m: Meridian): string {
  const mats = Object.entries(m.mats).map(([k, v]) => `${v}× ${k}`).join(' + ')
  return mats ? `${m.insight} insight + ${mats}` : `${m.insight} insight`
}

/**
 * The permanent half of the game. Kept on its own screen rather than folded into Arts
 * because the two are opposites: an art is a loadout decision you revisit every realm,
 * a meridian is a purchase you make once and never think about again.
 */
export function Meridians({ state, onOpen }: {
  state: PlayerState
  onOpen: (id: string) => void
}) {
  const rows = meridiansAt(state)
  const at = (id: string) => rows.find((r) => r.meridian.id === id)!
  const opened = state.meridians.length

  return (
    <div className="screen">
      <p className="label">Meridians <span className="han">經脈</span></p>

      <div className="panel">
        <div className="row">
          <span className="k">Opened</span>
          <span className="v num">{opened} of {rows.length}</span>
        </div>
        <div className="bar"><i style={{ width: `${(opened / rows.length) * 100}%` }} /></div>
        <p className="hint">
          A meridian is bought once and kept for life — no upkeep, no slot, nothing to
          clash with. Insight and beast materials are the only currency, which makes
          hunting the thing that decides how strong you get rather than how long you wait.
        </p>
        <div className="matrow wide">
          <div className="mat">
            <Glyph symbol="g-bone" size={22} />
            <span className="mn">Insight</span>
            <span className="mv num">{state.insight}</span>
          </div>
          {MATERIALS.map((mt) => (
            <div className="mat" key={mt.id}>
              <Glyph symbol={MAT_GLYPH[mt.id]} size={22} />
              <span className="mn">{mt.name}</span>
              <span className="mv num">{count(state.satchel, mt.id as MaterialId)}</span>
            </div>
          ))}
        </div>
      </div>

      {COURSES.map((c) => {
        const list = courseOf(c)
        const done = list.filter((m) => state.meridians.includes(m.id)).length
        return (
          <div key={c}>
            <p className="label">
              {COURSE_NAME[c].name} <span className="han">{COURSE_NAME[c].zh}</span> · {done}/{list.length}
            </p>
            <div className="list">
              {list.map((m) => {
                const r = at(m.id)
                const blocked = !r.reachable
                const can = !r.open && r.reachable && r.realmReady && r.affordable
                const why = r.open ? 'open'
                  : blocked ? 'locked'
                  : !r.realmReady ? `realm ${m.realm}`
                  : r.affordable ? 'open it'
                  : 'not yet'
                return (
                  <button
                    key={m.id}
                    className={`card${r.open ? ' on' : ''}${blocked || !r.realmReady ? ' locked' : ''}`}
                    disabled={!can}
                    onClick={() => onOpen(m.id)}
                  >
                    {/* The step number, not a glyph. Three courses drawn with three
                        near-identical marks said nothing; the position in the course is
                        the one fact about a meridian that the rows do not already state. */}
                    <span className={`step${r.open ? ' on' : ''}`}>{m.step}</span>
                    <span className="cb">
                      <span className="cn">{m.name} <span className="han dim-han">{m.zh}</span></span>
                      <span className="cd">{m.text}</span>
                      <span className="cd dim">
                        {r.open ? 'opened, permanently'
                          : blocked ? `opens after ${courseOf(c)[m.step - 2].name}`
                          : price(m)}
                      </span>
                    </span>
                    <span className={`cx${can || r.open ? '' : ' dim'}`}>{why}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <p className="hint centered">
        {COURSE_NAME.hand.note} {COURSE_NAME.foot.note} {COURSE_NAME.extra.note}
      </p>
    </div>
  )
}
