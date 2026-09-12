import { useState } from 'react'
import { BEASTS } from '../../core/beasts.ts'
import { MATERIALS } from '../../core/materials.ts'
import {
  canHunt, huntCost, huntCharges, nextChargeAt, quarry, dangerHere, maxCharges,
  trailAt, trailEndsAt,
} from '../../core/hunt.ts'
import { wardenOf, odds as wardenOdds, known, canChallenge, wardenCost, WARDEN_CHARGES } from '../../core/wardens.ts'
import { Figure } from '../art/Figure.tsx'
import { Scene } from '../art/Scene.tsx'
import { Lore } from '../Lore.tsx'
import { GROUNDS, ground, openAt, quarryOf, groundOf } from '../../core/grounds.ts'
import { TURMOIL_MAX, ratePerSecond } from '../../core/progress.ts'
import { duration, short } from '../../core/format.ts'
import type { PlayerState } from '../../core/state.ts'

/**
 * 狩 The hunt: where to go, what is standing there, and what is underneath it.
 *
 * This was a list of six identical cards followed by a warden section, and the warden
 * section was a duplicate — the same six bosses were also listed on the Gear tab. A list
 * cannot say "deeper", which is the one thing a player needs to understand about these
 * places, and six cards with the same border cannot say that the Sunken Palace is not
 * the Ash Slopes.
 *
 * So it is a descent. A rail runs down the left and fills as grounds open; each ground
 * carries its own drawn horizon, lit by the phase of the realm that opens it; shut
 * grounds are fogged from below rather than greyed out, because you should be able to
 * see there is something down there. Tapping one opens what is actually inside it: the
 * three beasts, which you have recorded, and the warden at the bottom — which now lives
 * here and nowhere else.
 */
const RANK_TIER: Record<number, [string, string, string]> = {
  1: ['#1B4A2E', '#3E8C4E', '#9FD3A8'],
  2: ['#8B3D10', '#D0741C', '#F0B25C'],
  3: ['#5E6875', '#B9C3CE', '#F2F7FB'],
}

const pc = (v: number) => `${Math.round(v * 100)}%`
const signed = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v * 100))}%`

/** Where a ground sits on the way down, said in one word on the rail. */
const DEPTH: Record<string, string> = {
  ash: 'surface', marsh: 'lowland', wood: 'deep',
  ridge: 'high', palace: 'drowned', scar: 'outside',
}

export function Hunt({ state, now, onHunt, onTravel, onChallenge }: {
  state: PlayerState
  now: number
  onHunt: () => void
  onTravel: (id: string) => void
  onChallenge: (id: string) => void
}) {
  /* The ground you are standing in is open by default: it is the one you can act on. */
  const [open, setOpen] = useState<string | null>(state.ground)

  const ready = canHunt(state, now)
  const charges = huntCharges(state, now)
  const nextAt = nextChargeAt(state, now)
  const waiting = nextAt ? Math.max(0, nextAt - now) / 1000 : 0
  const broke = charges > 0 && state.qi < huntCost(state)
  const here = ground(state.ground)
  const cap = maxCharges(state)
  const danger = dangerHere(state)
  const rate = ratePerSecond(state, now)
  const untilAfford = rate > 0 ? (huntCost(state) - state.qi) / rate : Infinity
  const trail = quarry(state).length > 0 ? trailAt(state.ground, now) : undefined
  const turns = (trailEndsAt(now) - now) / 1000

  return (
    <div className="screen">
      {/* The one thing worth reading before spending anything. */}
      {trail && (
        <div className="trail">
          <Figure symbol={trail.symbol} size={52} />
          <span className="tb">
            <span className="tk">On the trail · {here.name}</span>
            <span className="tn">{trail.name} <span className="han dim-han">{trail.zh}</span></span>
            <span className="td">Drops {MATERIALS[trail.rank - 1].name} until it turns over.</span>
          </span>
          <span className="tt">turns in<br />{duration(turns)}</span>
        </div>
      )}

      <div className="panel">
        <div className="charges" aria-label={`${charges} of ${cap} hunts held`}>
          {Array.from({ length: cap }, (_, i) => (
            <i key={i} className={i < charges ? 'on' : ''} />
          ))}
        </div>
        <div className="row">
          <span className="k">Hunts held</span>
          <span className="v num">{charges} of {cap}{waiting > 0 ? ` · next ${duration(waiting)}` : ''}</span>
        </div>
        <div className="row">
          <span className="k">One costs</span>
          <span className="v num">
            {short(huntCost(state))} qi{danger > 0 ? ` · +${danger} 心魔` : ''}
          </span>
        </div>
        <button className="cta" onClick={onHunt} disabled={!ready}>
          {ready ? `Hunt ${trail ? trail.name : 'here'}`
            : broke ? `Needs ${short(huntCost(state) - state.qi)} more qi · ${duration(untilAfford)}`
            : waiting > 0 ? `No hunts held · next in ${duration(waiting)}`
            : 'Nothing to hunt yet'}
        </button>
        {danger > 0 && state.turmoil + danger > TURMOIL_MAX * 0.5 && (
          <p className="hint warnline">
            Heart at {Math.round(state.turmoil)}. Four trips here put it at{' '}
            {Math.min(TURMOIL_MAX, Math.round(state.turmoil + danger * 4))}.
          </p>
        )}
      </div>

      <p className="label">Hunting grounds <span className="han">洞天</span></p>
      <p className="hint">What is on the trail is what you will find. So the question is where.</p>

      <div className="route">
        {GROUNDS.map((g, i) => {
          const reachable = openAt(g, state.realm)
          const standing = g.id === state.ground
          const shown = open === g.id
          const up = reachable ? trailAt(g.id, now) : undefined
          const found = quarryOf(g).filter((b) => state.seenBeasts.includes(b.id)).length
          const boss = wardenOf(g.id)
          const nextOpen = GROUNDS[i + 1] && openAt(GROUNDS[i + 1], state.realm)
          return (
            <div className="stop" key={g.id}>
              {/* The rail is what a list cannot do: it says these places are one below
                  the next, and how far down the one you are standing in is. */}
              <div className="rail">
                <span className={`ln${reachable && i > 0 ? ' done' : ''}`}
                      style={i === 0 ? { flex: '0 0 10px' } : undefined} />
                <span className={`pin${reachable ? ' open' : ''}${standing ? ' here' : ''}`} />
                <span className="depth">{DEPTH[g.id]}</span>
                <span className={`ln${nextOpen ? ' done' : ''}`}
                      style={i === GROUNDS.length - 1 ? { flex: '0 0 10px' } : undefined} />
              </div>

              <div className={`place${standing ? ' here' : ''}${reachable ? '' : ' shut'}${shown ? ' open' : ''}`}>
                <button className="vign" disabled={!reachable}
                        aria-expanded={shown}
                        onClick={() => setOpen(shown ? null : g.id)}>
                  <Scene id={g.id} realm={g.realm} fogged={!reachable} />
                  <span className="cap">
                    <span className="pn">{g.name}</span>
                    <span className="han dim-han">{g.zh}</span>
                    <span className="go">
                      {standing ? 'here' : reachable ? (shown ? 'close' : 'look') : `realm ${g.realm}`}
                    </span>
                  </span>
                </button>

                <div className="pbody">
                  {reachable && up && (
                    <p className="upnow">
                      <b>{up.name}</b> on the trail · {MATERIALS[up.rank - 1].name}
                    </p>
                  )}
                  <span className="chips">
                    {MATERIALS.map((m) => {
                      const n = quarryOf(g).filter((b) => b.rank === m.rank).length
                      return n > 0 ? <span className="chip" key={m.id}>{n}× {m.name}</span> : null
                    })}
                    <span className={`chip${g.danger ? ' hot' : ' good'}`}>
                      {g.danger ? `+${g.danger} 心魔` : 'no 心魔'}
                    </span>
                    {g.bonus > 0 && <span className="chip good">+{g.bonus} haul</span>}
                    <span className={`chip${found === 3 ? ' lit' : ''}`}>{found}/3 recorded</span>
                  </span>

                  {shown && reachable && (
                    <div className="pdetail">
                      <Lore>{g.note}</Lore>
                      <div className="quarry">
                        {quarryOf(g).map((b) => {
                          const seen = state.seenBeasts.includes(b.id)
                          return (
                            <div className={`q${up?.id === b.id ? ' up' : ''}${seen ? ' seen' : ''}`} key={b.id}>
                              <Figure symbol={b.symbol} size={44} dim={!seen} />
                              <b>{seen ? b.name : '???'}</b>
                              <span>{seen ? MATERIALS[b.rank - 1].name : 'not recorded'}</span>
                            </div>
                          )
                        })}
                      </div>
                      {boss && <WardenBlock
                        state={state} boss={boss} standing={standing} charges={charges}
                        found={found} onChallenge={onChallenge} />}
                      {!standing && (
                        <button className="cta ghost" onClick={() => onTravel(g.id)}>
                          Travel to {g.name}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="label">Bestiary · {state.seenBeasts.length} of {BEASTS.length} taken</p>
      <div className="grid">
        {BEASTS.map((b) => {
          const seen = state.seenBeasts.includes(b.id)
          const g = groundOf(b.id)
          const reachable = !!g && openAt(g, state.realm)
          const [lo, mid, hi] = RANK_TIER[b.rank]
          return (
            <div className="beast" key={b.id}
                 style={seen ? { ['--flame-lo' as string]: lo, ['--flame-mid' as string]: mid, ['--flame-hi' as string]: hi } : undefined}>
              <Figure symbol={b.symbol} size={72} dim={!seen} label={seen ? `${b.name}. ${b.note}` : undefined} />
              <span className="bn">{seen ? b.name : '???'}</span>
              <span className="bz han">{seen ? b.zh : ''}</span>
              <span className="brk">
                {seen ? MATERIALS[b.rank - 1].name : reachable ? g?.name ?? '' : `realm ${g?.realm ?? 1}`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 妖王 The thing at the bottom of this ground.
 *
 * It lives inside its ground's card, which is the only place it was ever about. It used
 * to be a section of its own on this screen *and* a section on the Gear tab, so the same
 * six bosses appeared twice in a game with twenty-eight cards on one page.
 *
 * The full ledger only unrolls for the ground you are standing in, because that is the
 * only ground whose warden you can actually face. Everywhere else it is one line saying
 * what is down there and what it would take.
 */
function WardenBlock({ state, boss, standing, charges, found, onChallenge }: {
  state: PlayerState
  boss: NonNullable<ReturnType<typeof wardenOf>>
  standing: boolean
  charges: number
  found: number
  onChallenge: (id: string) => void
}) {
  const seen = known(state, boss)
  const beaten = state.wardens.includes(boss.id)
  const wo = seen ? wardenOdds(state, boss) : null
  const canFight = canChallenge(state, boss, charges)

  if (!standing || !seen) {
    return (
      <div className={`bossrow${seen ? '' : ' shut'}`}>
        <Figure symbol={seen ? boss.symbol : 's-wraith'} size={38} dim={!seen} />
        <span className="bb">
          <span className="bn">{seen ? boss.name : 'Something below'}
            <span className="han dim-han"> {seen ? boss.zh : '???'}</span></span>
          <span className="bd">
            {beaten ? 'already put down'
              : seen ? 'stand here to face it'
              : `record all three · ${found}/3`}
          </span>
        </span>
      </div>
    )
  }

  return (
    <div className="bosspanel">
      <div className="bosstop">
        <Figure symbol={boss.symbol} size={96} flames motes={10}
                label={`${boss.name}. ${boss.text}`} />
        <div className="bossid">
          <p className="bn">{boss.name}</p>
          <p className="bz han">{boss.zh}</p>
        </div>
      </div>
      <Lore>{boss.text}</Lore>
      {wo && (
        <>
          <div className="ledger">
            <div className="lr"><span>Base</span><b>{pc(wo.base)}</b></div>
            <div className="lr">
              <span>Standing · {Math.max(0, state.realm - ground(boss.ground).realm)} realms above</span>
              <b className={wo.standing > 0 ? 'up' : ''}>{signed(wo.standing)}</b>
            </div>
            <div className="lr">
              <span>Craft · {state.equipped.length} arts, refined</span>
              <b className={wo.craft > 0 ? 'up' : ''}>{signed(wo.craft)}</b>
            </div>
            {wo.gear > 0 && (
              <div className="lr"><span>What you are wearing</span><b className="up">{signed(wo.gear)}</b></div>
            )}
            <div className="lr">
              <span>Heart demon at {Math.round(state.turmoil)}</span>
              <b className={wo.turmoil < 0 ? 'dn' : ''}>{signed(wo.turmoil)}</b>
            </div>
            <div className="lr tot"><span>Your odds</span><b>{pc(wo.total)}</b></div>
          </div>
          <div className="row">
            <span className="k">Going in costs</span>
            <span className="v num">{WARDEN_CHARGES} hunts · {short(wardenCost(state))} qi</span>
          </div>
          <button className="cta gold" onClick={() => onChallenge(boss.id)} disabled={!canFight}>
            {canFight ? `Face ${boss.name}`
              : charges < WARDEN_CHARGES ? `Needs ${WARDEN_CHARGES} hunts held`
              : `Needs ${short(wardenCost(state))} qi`}
          </button>
          <p className="hint">
            Losing costs the qi, twenty calm and six hours of injury. Never the realm
            {beaten ? '.' : ', and the relic drops once.'}
          </p>
        </>
      )}
    </div>
  )
}
