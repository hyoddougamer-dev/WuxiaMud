export interface Beast {
  readonly id: string
  readonly name: string
  readonly zh: string
  readonly symbol: string
  readonly rank: 1 | 2 | 3
  readonly realm: number
  readonly note: string
}

export const BEASTS: readonly Beast[] = [
  { id: 'hare',    name: 'Ash Hare',        zh: '灰兔',   symbol: 's-hare',    rank: 1, realm: 1, note: 'Startles at qi. Common on the lower slopes.' },
  { id: 'beetle',  name: 'Iron Beetle',     zh: '鐵甲蟲', symbol: 's-beetle',  rank: 1, realm: 1, note: 'Its shell is worth more than the beast.' },
  { id: 'serpent', name: 'Jade Serpent',    zh: '青蛇',   symbol: 's-serpent', rank: 1, realm: 2, note: 'Coils in spirit springs and refuses to leave.' },
  { id: 'crane',   name: 'Immortal Crane',  zh: '仙鶴',   symbol: 's-crane',   rank: 1, realm: 3, note: 'Said to carry messages between sects.' },
  { id: 'fox',     name: 'Nine-Tailed Fox', zh: '九尾狐', symbol: 's-fox',     rank: 2, realm: 4, note: 'Each tail is a century it refused to die.' },
  { id: 'ape',     name: 'Stone Ape',       zh: '石猿',   symbol: 's-ape',     rank: 2, realm: 4, note: 'Sleeps for decades. Wakes badly.' },
  { id: 'tiger',   name: 'Thunder Tiger',   zh: '雷虎',   symbol: 's-tiger',   rank: 2, realm: 5, note: 'Storms follow it, or it follows storms.' },
  { id: 'roc',     name: 'Sky Roc',         zh: '天鵬',   symbol: 's-roc',     rank: 2, realm: 6, note: 'Its shadow crosses a valley in one beat.' },
  { id: 'qilin',   name: 'Flame Qilin',     zh: '炎麒麟', symbol: 's-qilin',   rank: 3, realm: 7, note: 'Burns without fuel. Judges without speaking.' },
  { id: 'wraith',  name: 'Yin Wraith',      zh: '陰魂',   symbol: 's-wraith',  rank: 3, realm: 7, note: 'A cultivator who took the deviant path and kept going.' },
]
