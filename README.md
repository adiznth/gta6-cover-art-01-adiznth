[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/adiznth/gta6-cover-art-01-adiznth/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/adiznth/gta6-cover-art-01-adiznth/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Neon Coast Cover Studio

A free offline web app that turns your photos and a caption into a sunset-poster cover in the style of a big open-world game's key art: multi-panel layouts, bold display lettering, a neon Vice-City-style colour grade, and a one-click PNG export in the post sizes people actually share. Everything runs in your desktop browser from static files — your photos never leave your machine, and the app makes no network request at all.

## What it does

- **Any photo, up to three:** load photos from your machine (or try the two built-in samples), then assign each one to a panel.
- **Six layouts:** Hero + Duo, Four Grid, Full Bleed, Tilted Trio, Strip Trio, and a diagonal Duo Split.
- **Crop and position per panel:** click a panel in the live preview, drag its photo to move it, scroll to zoom, or use the zoom slider.
- **Five colour grades:** Sunset, Neon Nights, Golden Hour, Midnight, and Palm Teal — each a gradient-map wash over the photos plus a dusk band behind the words.
- **Words that look printed:** a big condensed title (Anton, SIL Open Font License), a script subtitle (Pacifico, SIL OFL), a tag line, a halftone dot row, film grain, vignette, and a poster frame.
- **Three post sizes, one click:** 1080 × 1080, 1080 × 1350, and 1920 × 1080, exported as PNG. Undo and redo are built in.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080> in a desktop browser. No build step, no install.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json`.

## Originality

Every visual in the app is original: the lettering uses the open-licensed Anton and Pacifico fonts (vendored under `app/fonts/` with their licence texts), the sample photos were made with an image model for make.fun, and no logo, artwork, character, or font from any game is used anywhere.

---

Built for the [gta6-cover-art-01 bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01). Optional: earn referral rewards, a second way to make money — [join make.fun with my referral link](https://make.fun/r/p9nkmgn8).
