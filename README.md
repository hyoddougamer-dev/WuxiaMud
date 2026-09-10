# Ninefold 九重

Nine realms, and an idle cultivation game where a path is a schedule, not a power level — and where
progress flows down a lineage from master to disciple.

**Where the APK is:** every push builds one and publishes it here, at a URL that
never changes:

<https://github.com/hyoddougamer-dev/WuxiaMud/releases/download/lineage-latest/lineage-latest.apk>

It is an unsigned debug build, so Android will warn about an unknown source; you have
to allow "install unknown apps" for whatever opens it.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # the progress engine and the path balance
npm run build      # typecheck + production bundle into dist/
npm run preview    # serve the production build
```

## What the game actually is

Nine realms. You pick a **path** — a schedule, not a power level — and cultivate. Every
system below exists to make one decision interesting: **when to break through.**

| System | What it does | Why it earns its place |
|---|---|---|
| **Paths** 劍修 / 刀修 | Sword sharpens while untouched; Blade decays from every visit. Same daily total. | The class is a rhythm, so the game fits your life instead of demanding one. |
| **Realms** 練氣→合體 | Seven reachable of nine. Colour of every asset warms as you climb. | Progress you can see at a glance, without reading a number. |
| **Tribulation** 雷劫 | From realm 3, breaking through is a roll. Odds shown before you commit. | The only real decision in the game, and the reason the rest exists. |
| **Heart demon** 心魔 | Turmoil rises as you cultivate. Past 50 it eats your rate and your odds. | The cost axis. Speed and safety pull against each other. |
| **Settling** | Drop to 15% output to drain turmoil fast. | Makes the cost payable, at a price you feel. |
| **Arts** | 18 techniques, six slots — each with **upkeep in qi/second**. | Upkeep is what turns a shopping list into a build. A full bar is rarely the right bar. |
| **The hunt** 狩 | Spend stored qi on a 25-minute cooldown to take a beast. | The one active verb. Competes with breaking through for the same qi. |
| **Pills** 丹 | Three, brewed from beast materials: quiet the heart, buy 20% of tribulation odds, bank two hours. | The sink that makes hunting matter and tribulations plannable. |
| **Flames** 異火 | Three, each changing a *rule* rather than a number. | If it can be written as "+15% to something", it does not ship. |
| **Bestiary** | Ten beasts, recorded by hunting them. | Earned, not unlocked by realm. |
| **Lineage** | Deliberately a stub. | It needs accounts and a server clock; faking it locally teaches nothing. |

### The loop, in one paragraph

Cultivate. Turmoil rises. Around realm 3 the breakthrough becomes a gamble, and now you
have three levers and a real choice: **wait** past the cost for surplus, **settle** to
quiet the heart, or **hunt** for materials and brew a pill. Each costs something the
others want — time, output, or the same stored qi. Fail and you keep the realm but lose
half your qi and two hours to injury. Pass and the heart quiets on the other side.

## How it is arranged

```
src/core/     pure game logic — no browser APIs, no React, no Date.now()
src/ui/       React components, screens and the SVG art sprite
src/styles/   the seventeen colours and everything built from them
test/         the progress engine and the balance assertion between paths
```

**`src/core` is the part that matters.** It is pure and free of browser APIs on
purpose: today it runs on the client, and before any merit flows between players it
moves to an edge function *unchanged*, with the client keeping only a display copy.
Nothing in there may read `Date.now()`, `localStorage` or `window` — `advance(state,
now)` takes the instant as an argument for exactly this reason.

That is not architectural neatness. In a solo idle game a forged clock only cheats the
person forging it; the moment progress flows between players, it steals from someone
real.

## The balance assertion

`test/paths.test.ts` enforces the central design claim: Sword left alone for a day and
Blade opened five times across a day land within 5% of each other. If a tuning change
breaks that, the build fails. Sword and Blade are meant to be two schedules, not a
strong option and a weak one.

## Android

The web build is the product; the APK is a wrapper around it.

```bash
npm run cap:sync   # build + copy into android/
npm run cap:open   # open in Android Studio
```

There is no Android SDK in the development container, so APKs are built in CI:
`.github/workflows/lineage-android.yml` produces a **debug** APK on every push and
uploads it as an artifact. A release APK needs a signing keystore, which must never be
committed — add it as a repository secret when you want signed builds.

## Known gaps

- **Fonts load from Google Fonts.** Fine on the web, wrong for the APK, which should
  work offline. Self-host the four families before shipping to a store.
- **Icons are SVG only.** Android wants PNG launcher icons at several densities.
- **Progress is client-side.** By design for the slice, and the first thing to change.
- **Balance numbers are placeholders.** They are shaped correctly and tuned against
  nothing but arithmetic; real values come from a closed test.
