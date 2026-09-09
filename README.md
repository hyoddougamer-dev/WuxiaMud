# Lineage

An idle cultivation game where a path is a schedule, not a power level — and where
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

## What exists today

The vertical slice from weeks 1–7 of the plan: the Cultivate loop, both paths, realms,
techniques, flames, the bestiary, offline progress, and the PWA shell. Lineage — the
co-op layer the game is named after — is deliberately stubbed, because it cannot be
built honestly without accounts and a server-owned clock.

| Screen | State |
|---|---|
| Cultivate | Complete. Realms 1–7, breakthroughs, offline accrual, the qi ring. |
| Arts | Complete. 18 techniques, insight, slots that open as you climb. |
| Sect | Complete. Realm ladder, three flames, ten-beast bestiary. |
| Lineage | Stub. Shows the shape and says plainly what is missing. |

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
