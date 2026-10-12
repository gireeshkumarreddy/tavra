# TĀVRA — women's sportswear, Indian heritage

A one-page concept site for TĀVRA: women's sportswear that carries Indian textile art on Western performance cuts. Static HTML, CSS and JavaScript; no build step.

## Run

```sh
python -m http.server 5194
```

Then open http://localhost:5194. The page needs a local server (it uses ES modules).

**Images are not in this repository.** Photos, textile tiles and sky layers live in `assets/` (`assets/photos`, `assets/textiles`, `assets/sky`), which is ignored by git. Copy that folder in beside `index.html` before running. The hero film streams from CloudFront.

## Structure

- `index.html` — the page: film hero, Craft (the scroll transformation), About, Sport, Lineup, Origins, the store, Campaign, Capsules and the footer.
- `css/site.css` — all styles, in cascade layers (reset, tokens, base, layout, components, motion, utilities).
- `js/app.js` — one requestAnimationFrame loop drives every scroll effect, plus the lineup, sport stage, Origins collage, store and bag.
- `js/plate.js` — the scroll-scrubbed video behind the hero and Craft (WebCodecs frame bank, `<video>` fallback).
- `js/data.js` — products, sports, lineup looks, Origins pieces.
- `tools/make-sky.py` — paints the sky's cloud layers into `assets/sky/`.
- `tools/cut-origins.py` — cuts the Origins reference images into the collage pieces in `assets/photos/`.
- `index-v1.html` — the earlier single-file version, kept for reference.
- `VIDEO-PROMPTS.md` — prompts for generating a real outfit-change film.

When you change `css/site.css` or a script, bump the `?v=` number in `index.html` and on the imports at the top of `js/app.js` so browsers fetch the new files.

All products, prices and imagery are concepts; checkout, payment and stock are not connected.
