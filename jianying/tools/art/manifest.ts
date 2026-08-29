/**
 * What is worth generating, and what is not.
 *
 * The list below is short on purpose, and the omission is the argument: THE ART
 * ICONS ARE NOT HERE. Sixteen 34px marks that must be told apart at a glance
 * are the worst possible use of a generative model — it cannot be told "make
 * this one not look like that one", the sixteen would have to agree with each
 * other stylistically, and every regeneration would produce a different set.
 * They are drawn from geometry instead; see `src/render/artGlyph.ts`, and
 * `docs/pack.png` for the free-pack alternative.
 *
 * What generation IS good for is the opposite case: one large image, seen once,
 * where detail is the whole point and nothing has to be distinguished from
 * anything. Key art. A region's establishing image. A boss nobody has met yet.
 * That was the plan from the first day of this project and it has not changed.
 *
 * Every prompt below is written to the same three rules, because consistency
 * across a set comes from the prompt as much as from the post-process:
 *   - name the MEDIUM first (水墨 ink wash on aged paper), never a game style;
 *   - describe SILHOUETTE and negative space, not colour — colour is thrown
 *     away by `inkify.mts` anyway, and asking for it wastes the model's budget;
 *   - forbid the things that break the register: no text, no signature, no
 *     border, no frame, no watermark.
 */

export interface ArtPiece {
  /** File written to docs/generated/<id>.png, and <id>.ink.png after processing. */
  readonly id: string
  /** What this is for, in one line — shown in the sheet and in the log. */
  readonly use: string
  readonly prompt: string
  /** Square unless a piece genuinely needs the shape. */
  readonly size?: '1024x1024' | '1024x1536' | '1536x1024'
}

/** The shared register. Prepended to every prompt so the set cannot drift. */
export const STYLE =
  '水墨 Chinese ink wash painting on aged rice paper. Monochrome black ink, ' +
  'wet brush, visible bristle edges, large areas of empty paper. Bold simple ' +
  'silhouettes with almost no interior detail. Sparse and calm. ' +
  'No text, no letters, no signature, no seal, no border, no frame, no watermark.'

export const PIECES: readonly ArtPiece[] = [
  {
    id: 'key-art',
    use: 'Título e loja',
    prompt:
      'A lone swordsman standing on a narrow cliff edge, seen small against a ' +
      'vast empty sky. Distant mountains suggested by two or three wet strokes. ' +
      'The figure is a silhouette, no face. Most of the image is bare paper.',
    size: '1024x1536',
  },
  {
    id: 'region-road',
    use: '官道 The Post Road',
    prompt:
      'An empty road crossing flat open ground, drawn as a single receding ' +
      'line. Two bare trees at the edge. Enormous empty sky above.',
    size: '1536x1024',
  },
  {
    id: 'region-marsh',
    use: '苇泽 The Reed Marsh',
    prompt:
      'Tall reeds in shallow water, dense vertical strokes filling the lower ' +
      'third. Heavy mist. Nothing visible beyond the reeds.',
    size: '1536x1024',
  },
  {
    id: 'region-cliff',
    use: '断崖 The Broken Cliff',
    prompt:
      'A sheer broken cliff face, black wet ink, a narrow ledge crossing it. ' +
      'Loose rock falling. The drop below is bare paper.',
    size: '1536x1024',
  },
  {
    id: 'region-market',
    use: '鬼市 The Ghost Market',
    prompt:
      'Crowded stalls at night suggested by hanging lanterns and rooftops ' +
      'only, the people as faint grey shapes with no detail.',
    size: '1536x1024',
  },
  {
    id: 'region-pass',
    use: '关 The Pass',
    prompt:
      'A fortified mountain pass gate seen from below, massive and dark, the ' +
      'road climbing to it. Steep rock on both sides.',
    size: '1536x1024',
  },
  {
    id: 'boss-shrike',
    use: 'Chefe do 断崖',
    prompt:
      'A tall gaunt figure in a tattered cloak perched on a rock, arms held ' +
      'wide like a bird about to drop. Pure silhouette, no face.',
  },
  {
    id: 'boss-general',
    use: 'Chefe do 关',
    prompt:
      'An armoured general standing motionless with a long blade point-down ' +
      'in the ground, seen from the front. Heavy black shape, no face.',
  },
]
