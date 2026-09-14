# Ninefold 九重 — Art Bible

Painted character art for the game, in the register of a Chinese donghua: *Battle Through
the Heavens*, *Soul Land*, *A Record of a Mortal's Journey to Immortality*. Cel-shaded,
high contrast, glowing qi, restrained palette.

This document exists because **the art has to be generated outside the codebase** and the
last attempt at an asset library failed for one reason: every piece was generated in a
different session with a different prompt, so thirty pieces shared no style. Nothing here
is about a single image. It is about the four things that make thirty images look like one
game — **one style block, one palette, one camera, one batch**.

---

## 0 · How to use this

Pick one generator and stay on it for the whole set:

| Route | Cost | Notes |
|---|---|---|
| **NijiJourney** (or Midjourney with `--niji 6`) | ~$10/month | Closest to donghua out of the box. Recommended. |
| **Leonardo.ai** | free tier / ~$10 | Already used on the previous project; knows the style. |
| **Stable Diffusion / ComfyUI** with an anime checkpoint (Illustrious, NoobAI) + a wuxia LoRA | free with a GPU | Most control, most setup. Best if you want a seed-locked set. |
| **Commission** | ~$50–200 a piece | 33 pieces = $1,650–6,600. Only worth it once the game has players. |

Then:

1. Generate **the whole set in one sitting**, in the order below. Do not come back a month
   later for "the missing three" — that is exactly how the last library drifted.
2. On Midjourney/Niji, generate cultivator 1 first, then pass its image as a **style
   reference** (`--sref <url>`) to every other prompt in the set. This is the single
   highest-leverage step in this document.
3. Keep the seed family. On SD, lock the seed and vary only the subject clause.
4. Export as described in §4 and drop into `public/art/` with the exact filenames given.

---

## 1 · The locked style block

Paste this **verbatim** in front of every subject clause. Do not improve it between
pieces — an inconsistent style block is the whole failure mode.

```
anime key visual, Chinese donghua xianxia, cel shaded with painterly rim light,
{SUBJECT},
lit by a single cold source from the upper left, deep shadow on the right,
glowing qi motes rising, black-green lacquer void background, no scenery,
restrained palette: near-black #05100D ground, jade #4ECFA3 and gold #D4A843 accents,
plus {PHASE} as the only saturated colour,
crisp confident line art, high contrast, dramatic low angle, centred, full figure,
--ar 1:1 --niji 6 --style raw --s 250
```

And the negative, every time:

```
--no photorealistic, 3d render, western fantasy, plate armour, gun, modern clothing,
watermark, text, signature, logo, extra limbs, extra fingers, blurry, washed out,
oversaturated, rainbow palette, busy background, landscape, multiple characters, chibi
```

### The phase colours

`{PHASE}` is not decoration — it is the game's 五行 system, and it is what makes realm 2
and realm 8 read as different worlds. Substitute the hex and the word.

| Realms | Phase | Word for the prompt | Hex |
|---|---|---|---|
| 1–2 | 木 wood | `verdant spring green` | `#5FAE68` |
| 3–4 | 火 fire | `ember vermilion` | `#D0442C` |
| 5–6 | 土 earth | `old gold ochre` | `#CE9A2C` |
| 7–8 | 金 metal | `cold silver white` | `#B9C3CE` |
| 9 | 水 water | `deep indigo blue` | `#5570CC` |

The deviant path 入魔 swaps the ramp entirely to violet `#9B6BFF`. That is why a deviant
cultivator reads as *wrong* on sight: violet belongs to no phase.

---

## 2 · The nine cultivators

One per realm. The brief is the same person climbing — same face, same weapon lineage,
**escalating** robe, aura and bearing. On Midjourney use `--cref` (character reference)
from realm 1 so the face carries.

Filename: `public/art/cultivator/r{n}.webp`

| # | Realm | Phase | `{SUBJECT}` |
|---|---|---|---|
| 1 | 練氣 Qi Refining | wood | `a barefoot young cultivator in a plain grey hemp robe, no ornament, holding a borrowed straight sword too big for them, thin green qi barely visible at the fingertips, uncertain stance` |
| 2 | 築基 Foundation | wood | `a young cultivator in a clean sect robe with a green sash, hair tied in a simple topknot, green qi now running visibly along the blade, steady stance` |
| 3 | 金丹 Golden Core | fire | `a cultivator mid-stride, robe open at the chest, a burning golden core visible as light under the sternum, vermilion flame curling off the shoulders, sword wreathed in fire` |
| 4 | 元嬰 Nascent Soul | fire | `a mature cultivator in an ornate layered robe with a long trailing hem, a small translucent infant-spirit hovering at the shoulder, vermilion aura ring behind the head` |
| 5 | 化神 Spirit Severing | earth | `a towering cultivator, robe torn at the sleeves, muscle and scar showing, ochre gold energy erupting from the back in two wing-like plumes, the ground cracked beneath` |
| 6 | 煉虛 Void Refining | earth | `a gaunt cultivator half-dissolved into gold motes at the edges, robe drifting as if underwater, one hand open with a small collapsing void sphere above the palm` |
| 7 | 合體 Unity | metal | `a cultivator in a silver-white ceremonial robe with mirror-bright ornaments, long white hair, cold silver qi forming a perfect circle behind them, expression serene` |
| 8 | 大乘 Great Vehicle | metal | `an immense cultivator seen from below, robe like falling snow, a silver domain of geometric light unfolding outward, smaller figures implied at the feet for scale` |
| 9 | 渡劫 Tribulation | water | `a cultivator standing in an indigo storm, nine bolts of heavenly lightning striking the shoulders and being held, robe shredded, eyes white with light, absolutely still` |

---

## 3 · The eighteen beasts and six wardens

Beasts are 妖獸 — spirit beasts, not animals. Every one gets **glowing qi somewhere on the
body** and an element that matches its ground. Half-body or full-body, dark void
background, same light direction.

Filename: `public/art/beast/{id}.webp` — the `id` column is the key the code already uses
(`src/core/beasts.ts`).

### 灰坡 Ash Slopes — grey scrub, nothing worth much

| id | Name | `{SUBJECT}` |
|---|---|---|
| `hare` | Ash Hare 灰兔 | `a lean ash-grey spirit hare, ears too long, faint green qi in the eyes, mid-leap` |
| `beetle` | Iron Beetle 鐵甲蟲 | `a boar-sized beetle with a lacquered iron carapace, green qi seeping between the plates` |
| `shrike` | Thorn Shrike 棘伯勞 | `a small vicious shrike with thorn-like tail feathers, perched on a spine of bone, green glow at the beak` |

### 蘆沼 Reed Marsh — standing water that never freezes

| id | Name | `{SUBJECT}` |
|---|---|---|
| `serpent` | Jade Serpent 青蛇 | `a coiled serpent of translucent jade, spirit water running inside its body like a vein, hood flared` |
| `crane` | Immortal Crane 仙鶴 | `a white spirit crane with a vermilion crown and impossibly long neck, a sealed scroll tied to one leg, green mist at the feet` |
| `toad` | Moon Toad 月蟾 | `a huge pale toad with the reflection of a full moon held inside its swollen throat, silver light leaking from the mouth` |

### 燼林 Cinder Wood — burnt a century ago, still warm

| id | Name | `{SUBJECT}` |
|---|---|---|
| `fox` | Nine-Tailed Fox 九尾狐 | `a nine-tailed fox spirit, each tail a different shade of ember, human intelligence in the eyes, vermilion flame at the paws` |
| `ape` | Stone Ape 石猿 | `a colossal ape of cracked grey stone, moss in the seams, ember light glowing from inside the cracks, waking from sleep` |
| `moth` | Lantern Moth 燈蛾 | `a moth the size of a man with wings like burning rice paper, a live flame visible inside the thorax` |

### 雷脊 Thunder Ridge — storms sit on it for weeks

| id | Name | `{SUBJECT}` |
|---|---|---|
| `tiger` | Thunder Tiger 雷虎 | `a white tiger with storm-cloud stripes, arcs of lightning crawling across the fur, 王 marking on the brow, roaring` |
| `boar` | Ironroot Boar 鐵根彘 | `a massive boar whose hide has grown into knotted iron tree-roots, tusks like split timber, gold qi at the hooves` |
| `lynx` | Frost Lynx 霜猞 | `a pale lynx with ice crystal tufts on the ears and spine, frozen breath, silver-blue qi, half-turned as if just noticed` |

### 沉宮 Sunken Palace — a sect that argued with the heavens and lost

| id | Name | `{SUBJECT}` |
|---|---|---|
| `roc` | Sky Roc 天鵬 | `an enormous roc seen from below, wings spanning the whole frame, gold qi trailing from each primary feather` |
| `turtle` | Black Stone Turtle 玄武龜 | `an ancient black turtle carrying a small ruined shrine on its shell, silver water pouring off the edges, eyes closed` |
| `drake` | Drowned Drake 溺蛟 | `a drowned dragon-serpent, waterlogged and pale, trailing rotted silk banners, indigo light in the sockets` |

### 天裂 The Scar — where the sky was opened and not closed

| id | Name | `{SUBJECT}` |
|---|---|---|
| `qilin` | Flame Qilin 炎麒麟 | `a qilin of white fire, single horn, scaled deer-like body, burning without fuel, expression of judgement` |
| `wraith` | Yin Wraith 陰魂 | `the wraith of a cultivator who took the deviant path, robe dissolving into violet smoke, face half gone, still holding a sword` |
| `hydra` | Nine-Head Python 九頭蟒 | `a nine-headed python, eight heads asleep and one awake, jade and black scales, coiled around a broken pillar` |

### 妖王 The six wardens

Wardens are the same beasts **elevated** — bigger, crowned, with a domain of qi around
them. Generate these last, once the style is locked, and push `--s` to 400.

Filename: `public/art/warden/{id}.webp`

| id | Name | `{SUBJECT}` |
|---|---|---|
| `grey` | The Grey King 灰王 | `the king of ash-grey spirit beasts, a monstrous elder hare-thing with a crown of bone antlers, sitting on a cairn` |
| `marsh` | The Marsh Lord 沼君 | `the lord of the marsh, a vast toad-emperor in rotted imperial silk, moon held in the throat, seated on a sunken throne` |
| `cinder` | The Cinder Mother 燼母 | `the mother of the burnt wood, a nine-tailed fox matriarch of white ash and ember, immense, eyes closed, tails filling the frame` |
| `sovereign` | The Thunder Sovereign 雷君 | `the sovereign of storms, a colossal tiger of living lightning standing on a thunderhead, the whole frame lit white` |
| `guardian` | The Palace Guardian 沉宮守 | `the guardian still at its post, an armoured stone turtle-warrior with a halberd, silver water pouring from its joints` |
| `skysplitter` | Skysplitter 裂天 | `the thing that came out of the Scar, a dragon-qilin hybrid of white fire and violet void, the sky torn open behind it` |

---

## 4 · Technical spec

The code expects these and nothing else.

| | Spec |
|---|---|
| **Format** | `.webp`, quality 80–85 |
| **Background** | Transparent for characters and beasts; wardens may keep a dark vignette |
| **Size** | Cultivators 720×900 · beasts 640×640 · wardens 800×800 |
| **Budget** | ≤ 60 KB each. 33 pieces ≈ 2 MB — acceptable; the app is under 400 KB today |
| **Naming** | Exactly the `id` column. `qilin.webp`, not `flame_qilin_final_v2.png` |

Removing the background: generate on a flat magenta field (`solid magenta background` in
the subject clause) and key it out, or run the batch through `rembg`. Do not ask the model
for "transparent background" and trust it.

### Dropping them in

```
public/art/
  cultivator/r1.webp … r9.webp
  beast/hare.webp … hydra.webp
  warden/grey.webp … skysplitter.webp
```

The game must keep working with pieces missing, so every `<img>` falls back to the existing
SVG glyph when the file is absent. That means **you can ship the first three and add the
rest later** without touching code — which is also what stops a half-finished art set from
blocking a release.

---

## 5 · What this does not cover

Backgrounds, VFX sheets, UI frames and icons are **not** on this list on purpose. They are
drawn in code — gradients, glow, particles, lattice, 漢字 — because that is the part that
has to change with game state (phase colour, realm, aura strength) and cannot be a file.
The painted art is the part that stands still: characters and beasts.
