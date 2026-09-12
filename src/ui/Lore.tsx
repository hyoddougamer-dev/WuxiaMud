import { useState } from 'react'

/**
 * 誌 A line of writing that is not the reason you are looking at this card.
 *
 * Every card in the game carried its name, its effect, its cost, its level and a
 * sentence or two of prose — all of them at the same size in the same grey, which is
 * the same thing as having no hierarchy at all. Nine of those on the Gear screen is a
 * wall of text, and a player told me so in exactly those words.
 *
 * The answer is not to delete the writing. The writing is most of what the game has,
 * and a cultivation game whose relics are stat lines is a spreadsheet with a title
 * screen. The answer is to rank it: the effect is what you are choosing between, the
 * numbers are what the choice costs, and the prose is atmosphere — so the prose is one
 * clipped line that opens when it is worth reading and is otherwise out of the way.
 *
 * Tapping the line itself rather than the card, because the cards it sits in already
 * have buttons in them and a tap target inside a tap target is a coin toss.
 */
export function Lore({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className={`lore${open ? ' open' : ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpen(!open) }
      }}
    >
      {children}
    </span>
  )
}
