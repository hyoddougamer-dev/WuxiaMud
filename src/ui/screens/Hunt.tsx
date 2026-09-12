import { BEASTS } from '../../core/beasts.ts'
import { MATERIALS } from '../../core/materials.ts'
import {
  canHunt, huntCost, huntCharges, nextChargeAt, quarry, dangerHere, maxCharges,
  trailAt, trailEndsAt,
} from '../../core/hunt.ts'
import { wardenOf, odds as wardenOdds, known, canChallenge, wardenCost, WARDEN_CHARGES } from '../../core/wardens.ts'
import { Figure } from '../art/Figure.tsx'
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

const pc = (v: number) => `${Math.round(v * 100)}%`
const signed = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v * 100))}%`

export function Hunt({ state, now, onHunt, onTravel, onChallenge }: {
  state: PlayerState
  now: number
  onHunt: () => void
  onTravel: (id: string) => void
  onChallenge: (id: string) => void
}) {
  const ready = canHunt(state, now)
  const charges = huntCharges(state, now)
  const nextAt = nextChargeAt(state, now)
  const waiting = nextAt ? Math.max(0, nextAt - now) / 1000 : 0
  const broke = charges > 0 && state.qi < huntCost(state)
  const pool = quarry(state)
  const here = ground(state.ground)
  const cap = maxCharges(state)
  const danger = dangerHere(state)
  const boss = wardenOf(here.id)
  const seen = boss ? known(state, boss) : false
  const wo = boss ? wardenOdds(state, boss) : null
  const canFight = boss ? canChallenge(state, boss, charges) : false
  // "Needs 150 qi" on a fresh save is a dead end unless it also says how long that is.
  const rate = ratePerSecond(state, now)
  const untilAfford = rate > 0 ? (huntCost(state) - state.qi) / rate : Infinity
  const trail = pool.length > 0 ? trailAt(state.ground, now) : undefined
  const turns = (trailEndsAt(now) - now) / 1000

  return (
    <div className="screen">
      {/* The trail is the one thing on this screen that is worth reading before you
          spend anything. It is what makes opening the app at a chosen moment better
          than opening it at a random one, without asking anyone to open it more often. */}
      {trail && (
        <div className="trail">
          <Figure symbol={trail.symbol} size={52} />
          <span className="tb">
            <span className="tk">On the trail · {here.name}</span>
            <span className="tn">{trail.name} <span className="han dim-han">{trail.zh}</span></span>
            <span className="td">
              This is what you will find here until it turns over. Drops{' '}
              {MATERIALS[trail.rank - 1].name}.
            </span>
          </span>
          <span className="tt">turns in<br />{duration(turns)}</span>
        </div>
      )}

      <p className="label">Hunting grounds <span className="han">洞天</span></p>
      <p className="hint">
        Each ground holds three beasts and therefore leans toward one material, and each
        stirs the heart every time you hunt there. What is on the trail is what you will
        find, so the question is not whether to hunt but where — and the grounds turn over
        independently, which is why looking twice a day is worth more than looking once.
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
          // What is up in this ground right now. Shown for every open ground, because
          // the whole decision the trail creates is a comparison between them.
          const up = open ? trailAt(g.id, now) : undefined
          return (
            <button key={g.id} className={`card${on ? ' on' : ''}${open ? '' : ' locked'}`}
                    disabled={!open || on} onClick={() => onTravel(g.id)}>
              <span className="cb">
                <span className="cn">{g.name} <span className="han dim-han">{g.zh}</span></span>
                {up && (
                  <span className="cd">
                    <b className="up">{up.name}</b> on the trail · {MATERIALS[up.rank - 1].name}
                  </span>
                )}
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
        <div className="charges" aria-label={`${charges} of ${cap} hunts held`}>
          {Array.from({ length: cap }, (_, i) => (
            <i key={i} className={i < charges ? 'on' : ''} />
          ))}
        </div>
        <div className="row">
          <span className="k">Hunts held</span>
          <span className="v num">{charges} of {cap}</span>
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
          <span className={`v num${danger > 0 ? '' : ' dim'}`}>
            {danger > 0 ? `+${danger} turmoil` : 'nothing'}
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
        {danger > 0 && state.turmoil + danger > TURMOIL_MAX * 0.5 && (
          <p className="hint warnline">
            Your heart is at {Math.round(state.turmoil)}. Four trips here put it at{' '}
            {Math.min(TURMOIL_MAX, Math.round(state.turmoil + danger * 4))}.
          </p>
        )}
        <p className="hint">
          A hunt costs five minutes of gathering and returns materials and insight —
          the two things meridians are bought with. Charges come back on their own
          whether the app is open or not and stop at {cap}, so checking in
          five times an evening earns no more than checking in once.
        </p>
      </div>

      {boss && (
        <>
          <p className="label">The warden <span className="han">妖王</span></p>
          <div className={`panel boss${seen ? '' : ' shut'}`}>
            <div className="bosstop">
              <Figure symbol={seen ? boss.symbol : 's-wraith'} size={110} dim={!seen}
                      flames={seen} motes={seen ? 10 : 0}
                      label={seen ? `${boss.name}. ${boss.text}` : 'A warden you have not met'} />
              <div className="bossid">
                <p className="bn">{seen ? boss.name : 'Something below'}</p>
                <p className="bz han">{seen ? boss.zh : '???'}</p>
              </div>
            </div>
            <p className="hint">
              {seen
                ? boss.text
                : `Record all three beasts of ${here.name} and it will know you are here.`}
            </p>
            {seen && wo && (
              <>
                <div className="ledger">
                  <div className="lr"><span>Base</span><b>{pc(wo.base)}</b></div>
                  <div className="lr">
                    <span>Standing · {Math.max(0, state.realm - here.realm)} realms above it</span>
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
                  Losing costs the qi, twenty of your calm and six hours of injury. It never
                  costs the realm{state.wardens.includes(boss.id) ? '.' : ', and the relic drops once.'}
                </p>
              </>
            )}
          </div>
        </>
      )}

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
