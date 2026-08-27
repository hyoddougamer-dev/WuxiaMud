/**
 * User-facing text.
 *
 * English is the product's default language. Everything the player can read
 * lives here rather than being scattered through the code, so adding a second
 * language later is a matter of swapping this object — not hunting for string
 * literals across the renderer, the HUD and the error handler.
 */
export const strings = {
  /** Shown until the player first touches the screen, and again if they idle. */
  moveHint: 'drag anywhere to move',
  /** Title on the fatal-error screen. */
  fatalTitle: 'Jiànyǐng failed to start',
} as const

export type StringKey = keyof typeof strings
