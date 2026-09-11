export interface Beast {
  readonly id: string
  readonly name: string
  readonly zh: string
  readonly symbol: string
  readonly rank: 1 | 2 | 3
  readonly note: string
}

/**
 * Eighteen beasts across six grounds.
 *
 * Rank decides the material. Where a beast lives — and therefore when you may hunt it
 * — is decided by its ground and nowhere else: a beast used to carry its own realm
 * number too, and two numbers that must agree are one too many. A simulation once
 * stalled every run at Void Refining because the realm on a beast and the realm on a
 * gate quietly disagreed about when True Essence became reachable.
 *
 * Three to a ground, and each ground leans toward one material, so choosing where to
 * hunt is choosing what to come back with.
 */
export const BEASTS: readonly Beast[] = [
  // 灰坡 Ash Slopes — hide, and nothing else
  { id: 'hare',    name: 'Ash Hare',        zh: '灰兔',   symbol: 's-hare',    rank: 1, note: 'Startles at qi. Common on the lower slopes.' },
  { id: 'beetle',  name: 'Iron Beetle',     zh: '鐵甲蟲', symbol: 's-beetle',  rank: 1, note: 'Its shell is worth more than the beast.' },
  { id: 'shrike',  name: 'Thorn Shrike',    zh: '棘伯勞', symbol: 's-shrike',  rank: 1, note: 'Leaves its kills on the branches, in a row, facing the same way.' },

  // 蘆沼 Reed Marsh — hide, and the first core
  { id: 'serpent', name: 'Jade Serpent',    zh: '青蛇',   symbol: 's-serpent', rank: 1, note: 'Coils in spirit springs and refuses to leave.' },
  { id: 'crane',   name: 'Immortal Crane',  zh: '仙鶴',   symbol: 's-crane',   rank: 1, note: 'Said to carry messages between sects.' },
  { id: 'toad',    name: 'Moon Toad',       zh: '月蟾',   symbol: 's-toad',    rank: 2, note: 'Swallows the reflection and holds it. Cut one open at the wrong hour and it is empty.' },

  // 燼林 Cinder Wood — cores
  { id: 'fox',     name: 'Nine-Tailed Fox', zh: '九尾狐', symbol: 's-fox',     rank: 2, note: 'Each tail is a century it refused to die.' },
  { id: 'ape',     name: 'Stone Ape',       zh: '石猿',   symbol: 's-ape',     rank: 2, note: 'Sleeps for decades. Wakes badly.' },
  { id: 'moth',    name: 'Lantern Moth',    zh: '燈蛾',   symbol: 's-moth',    rank: 1, note: 'Burns from the inside and lives eleven days doing it.' },

  // 雷脊 Thunder Ridge — cores, and a climb
  { id: 'tiger',   name: 'Thunder Tiger',   zh: '雷虎',   symbol: 's-tiger',   rank: 2, note: 'Storms follow it, or it follows storms.' },
  { id: 'boar',    name: 'Ironroot Boar',   zh: '鐵根彘', symbol: 's-boar',    rank: 2, note: 'Eats the roots of spirit trees and is mostly made of them by the end.' },
  { id: 'lynx',    name: 'Frost Lynx',      zh: '霜猞',   symbol: 's-lynx',    rank: 2, note: 'You hear it once, behind you, and never again.' },

  // 沉宮 Sunken Palace — the first True Essence
  { id: 'roc',     name: 'Sky Roc',         zh: '天鵬',   symbol: 's-roc',     rank: 3, note: 'Its shadow crosses a valley in one beat.' },
  { id: 'turtle',  name: 'Black Stone Turtle', zh: '玄武龜', symbol: 's-turtle',  rank: 2, note: 'Carries a shrine on its back that nobody built.' },
  { id: 'drake',   name: 'Drowned Drake',   zh: '溺蛟',   symbol: 's-drake',   rank: 3, note: 'Went into the water as something else and did not come back as it.' },

  // 天裂 The Scar — essence, and what the sky left behind
  { id: 'qilin',   name: 'Flame Qilin',     zh: '炎麒麟', symbol: 's-qilin',   rank: 3, note: 'Burns without fuel. Judges without speaking.' },
  { id: 'wraith',  name: 'Yin Wraith',      zh: '陰魂',   symbol: 's-wraith',  rank: 3, note: 'A cultivator who took the deviant path and kept going.' },
  { id: 'hydra',   name: 'Nine-Head Python', zh: '九頭蟒', symbol: 's-hydra',  rank: 3, note: 'Eight of the heads are asleep. That is the arrangement.' },
]

export function beast(id: string): Beast | undefined {
  return BEASTS.find((b) => b.id === id)
}
