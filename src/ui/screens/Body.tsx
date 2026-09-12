import { Glyph } from '../art/Glyph.tsx'
import { COURSE_NAME, courseOf, type Course, type Meridian } from '../../core/meridians.ts'
import { meridiansAt } from '../../core/progress.ts'
import { MATERIALS, count } from '../../core/materials.ts'
import { FLAMES } from '../../core/flames.ts'
import { PILLS, brewable, held, type PillId } from '../../core/pills.ts'
import type { MaterialId } from '../../core/materials.ts'
import type { PlayerState } from '../../core/state.ts'

const MAT_GLYPH: Record<string, string> = { hide: 'g-stone', core: 'g-cauldron', essence: 'g-talisman' }
const COURSES: Course[] = ['hand', 'foot', 'extra']

function price(m: Meridian): string {
  const mats = Object.entries(m.mats).map(([k, v]) => `${v}× ${k}`).join(' + ')
  return mats ? `${m.insight} insight + ${mats}` : `${m.insight} insight`
}

/**
 * 身 The body: what is permanently open inside it, and what burns there.
 *
 * Meridians and heavenly flames sit together because they are the same kind of thing
 * — changes to the cultivator rather than to the loadout. An art is a decision you
 * revisit every realm; these two you make once. The flames used to live on the Sect
 * screen next to the bestiary and the delete button, which told the player nothing
 * about what they were.
 */
export function Body({ state, onOpen, onPickFlame, onBrew, onTakePill }: {
  state: PlayerState
  onOpen: (id: string) => void
  onPickFlame: (id: string | null) => void
  onBrew: (id: PillId) => void
  onTakePill: (id: PillId) => void
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
        <p className="hint">Bought once, kept for life. No upkeep, no slot, nothing to clash with.</p>
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
            {/* A course is four channels that open in order — a shape, not a list. Drawn
                once above the rows so "what is open, what is next, what is still dark"
                is a glance rather than four cards' worth of reading. */}
            <div className="track" role="img"
                 aria-label={`${COURSE_NAME[c].name}: ${done} of ${list.length} open`}>
              {list.map((m, i) => {
                const isOpen = state.meridians.includes(m.id)
                const isNext = !isOpen && list.slice(0, i).every((x) => state.meridians.includes(x.id))
                return (
                  <span key={m.id} style={{ display: 'contents' }}>
                    {i > 0 && <span className={`span${isOpen ? ' open' : ''}`} />}
                    <span className={`node${isOpen ? ' open' : ''}${isNext ? ' next' : ''}`} />
                  </span>
                )
              })}
            </div>
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

      {/* 丹 The cauldron came here from the Gear tab. A pill is something you swallow —
          a temporary change to the cultivator — so it belongs beside the meridians and
          the flame rather than beside the things you wear. Gear was carrying twenty-eight
          cards across six sections, and three of them were these. */}
      <p className="label">The cauldron <span className="han">丹</span></p>
      <p className="hint">Brewed from the satchel the meridians spend. Brewing one you will not swallow is a channel you do not open.</p>
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
              <span className="acts">
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

      <p className="label">Heavenly flames <span className="han">異火</span></p>
      <p className="hint">
        A flame changes a rule rather than a number, and you hold one at a time. Taking
        a different one costs nothing but the one you had.
      </p>
      <div className="list">
        {FLAMES.map((f) => {
          const eligible = state.realm >= f.realm
          const on = state.flame === f.id
          return (
            <button
              key={f.id}
              className={`card${on ? ' on' : ''}${eligible ? '' : ' locked'}`}
              disabled={!eligible}
              onClick={() => onPickFlame(on ? null : f.id)}
            >
              <span className="cb">
                <span className="cn">{f.name} <span className="han dim-han">{f.zh}</span></span>
                <span className="cd">{f.rule}</span>
              </span>
              <span className={`cx${eligible ? '' : ' dim'}`}>
                {on ? 'held' : eligible ? 'take' : `realm ${f.realm}`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
