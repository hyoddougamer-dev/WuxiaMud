/**
 * 闪 — a esquiva.
 *
 * O que estes testes fixam não são números, são as três propriedades que fazem
 * dela uma resposta em vez de um empurrão: compromete-se numa direção, é
 * intocável enquanto dura, e custa alguma coisa.
 */
import { describe, expect, it } from 'vitest'
import {
  DODGE_COOLDOWN,
  DODGE_SPEED,
  DODGE_TIME,
  TRAIL_LENGTH,
  createDodge,
  dodgeCharge,
  dodgeReady,
  startDodge,
  updateDodge,
} from '../src/sim/dodge'
import { MAX_SPEED, createPlayer, updatePlayer } from '../src/sim/player'

const TICK = 1 / 60

/** Corre uma esquiva inteira e devolve quantos ticks durou. */
function dash(dodge: ReturnType<typeof createDodge>, player: ReturnType<typeof createPlayer>) {
  let ticks = 0
  while (updateDodge(dodge, player, TICK, MAX_SPEED)) ticks++
  return ticks
}

describe('闪 the dodge', () => {
  it('carries the player far enough to leave a body behind', () => {
    // O ponto todo: sair de onde se estava. Um inimigo alcança a cerca de 20
    // unidades (raio do jogador mais o dele), portanto um salto que não passe
    // disso com folga larga não resolve nada.
    const player = createPlayer(0, 0)
    const dodge = createDodge()
    expect(startDodge(dodge, player, 1, 0)).toBe(true)
    dash(dodge, player)
    expect(player.x).toBeGreaterThan(90)
    expect(Math.abs(player.y)).toBeLessThan(0.001)
  })

  it('commits to its direction — the thumb cannot steer it', () => {
    // Uma esquiva que se curva é um aumento de velocidade, não uma decisão. Se
    // isto falhar, o jogo ganhou um botão de correr e perdeu o verbo defensivo.
    const player = createPlayer(0, 0)
    const dodge = createDodge()
    startDodge(dodge, player, 1, 0)
    updateDodge(dodge, player, TICK, MAX_SPEED)
    // O polegar vira ao contrário a meio do salto.
    updatePlayer(player, -1, 0, TICK, MAX_SPEED)
    while (updateDodge(dodge, player, TICK, MAX_SPEED)) {
      /* segue em frente na mesma */
    }
    expect(player.x).toBeGreaterThan(80)
  })

  it('dodges the way the swordsman faces when the thumb is still', () => {
    // Um toque em pânico com o polegar parado é exatamente o momento em que a
    // esquiva mais faz falta. Não fazer nada aí seria o pior comportamento.
    const player = createPlayer(0, 0)
    player.faceX = 0
    player.faceY = -1
    const dodge = createDodge()
    startDodge(dodge, player, 0, 0)
    dash(dodge, player)
    expect(player.y).toBeLessThan(-90)
  })

  it('costs a cooldown, and says so before it is over', () => {
    const player = createPlayer(0, 0)
    const dodge = createDodge()
    startDodge(dodge, player, 1, 0)
    expect(dodgeReady(dodge)).toBe(false)
    expect(startDodge(dodge, player, 0, 1)).toBe(false)

    let elapsed = 0
    while (elapsed < DODGE_COOLDOWN - TICK) {
      updateDodge(dodge, player, TICK, MAX_SPEED)
      elapsed += TICK
      // O mostrador tem de subir monotonamente: um polegar aprende a lê-lo.
      expect(dodgeCharge(dodge)).toBeGreaterThan(0)
      expect(dodgeCharge(dodge)).toBeLessThanOrEqual(1)
    }
    updateDodge(dodge, player, TICK * 4, MAX_SPEED)
    expect(dodgeReady(dodge)).toBe(true)
    expect(dodgeCharge(dodge)).toBe(1)
  })

  it('lasts about as long as it claims to', () => {
    const player = createPlayer(0, 0)
    const dodge = createDodge()
    startDodge(dodge, player, 1, 0)
    const ticks = dash(dodge, player)
    expect(ticks).toBeGreaterThanOrEqual(Math.floor(DODGE_TIME * 60) - 1)
    expect(ticks).toBeLessThanOrEqual(Math.ceil(DODGE_TIME * 60) + 1)
  })

  it('never exceeds the speed it advertises', () => {
    // A folga que uma esquiva dá tem de ser previsível. Se a velocidade de pico
    // subisse acima do declarado, o alcance real deixaria de bater com a tabela
    // e ninguém perceberia porquê.
    const player = createPlayer(0, 0)
    const dodge = createDodge()
    startDodge(dodge, player, 1, 0)
    let peak = 0
    while (updateDodge(dodge, player, TICK, MAX_SPEED)) {
      peak = Math.max(peak, Math.hypot(player.vx, player.vy))
    }
    expect(peak).toBeLessThanOrEqual(MAX_SPEED * DODGE_SPEED + 0.001)
  })

  it('leaves a wake, and sweeps it up afterwards', () => {
    // Os fantasmas são desenhados a partir desta lista. Se ela não se esvaziar,
    // ficam colados no campo o resto da corrida — que foi como a primeira
    // versão se comportou.
    const player = createPlayer(0, 0)
    const dodge = createDodge()
    startDodge(dodge, player, 1, 0)
    dash(dodge, player)
    expect(dodge.trail.length).toBeGreaterThan(1)
    expect(dodge.trail.length).toBeLessThanOrEqual(TRAIL_LENGTH)

    for (let i = 0; i < TRAIL_LENGTH + 2; i++) updateDodge(dodge, player, TICK, MAX_SPEED)
    expect(dodge.trail).toHaveLength(0)
  })

  it('starts a fresh wake rather than joining the last one', () => {
    const player = createPlayer(0, 0)
    const dodge = createDodge()
    startDodge(dodge, player, 1, 0)
    dash(dodge, player)
    const first = dodge.trail.length
    dodge.cooldown = 0
    startDodge(dodge, player, 0, 1)
    expect(dodge.trail).toHaveLength(0)
    dash(dodge, player)
    expect(dodge.trail.length).toBe(first)
  })
})
