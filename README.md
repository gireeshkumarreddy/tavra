# TĀVRA — Women's Editorial & Collection

Two responsive pages rebuilt around the user's two image references. All models and catalogue pieces are women-only. Original Indian-inspired designs replace reference brand imagery.

## Open or deploy
Open `dist/index.html` for the editorial page, or `dist/collection.html` for the separate collection page. No installation or build step is required. Both pages work through ordinary static hosting and all assets are local.

```sh
python3 -m http.server 8000 --directory dist
```

Deploy the contents of `dist/`. Original generated PNGs are in `original-assets/`; optimized WebP images and small product variants are in `dist/assets/`.

## Pages
- `index.html`: warm ivory, rose and sage editorial composition, portrait collage, central-model lineup with faded flankers, sharp campaign mosaic, project accordions.
- `collection.html`: dark blue photographic surround, warm ivory store panel, side-profile two-model hero, campaign triptych, large movement image, floating category panels, category strip and catalogue.

## Colour edition
Six campaign images have been edited into full colour while retaining the original poses and garment silhouettes. Emerald tailoring, plum skirts, wine and peacock dresses, marigold outerwear and antique-gold embroidery replace the monochrome campaign. All grayscale filters have been removed; original activewear colours remain visible throughout. Jewel is a filterable collection.

## Interactions
- Collection lineup arrows, model selection, keyboard arrows, swipe, optional slideshow and reduced-motion support.
- Project accordions switch imagery.
- Separate-page links and deep links into filtered collections/categories.
- Eighteen women's concept products, including activewear, coats, sculptural skirts and column dresses.
- Search, category and collection filters, price sort, saved favourites.
- Product dialogs, image zoom, size selection and variant-aware concept bag.
- Bag quantities, removal, local persistence and selection export.
- Old catalogue entries that are no longer present are removed from local bag data on load.

## Reference and concept limits
The new references supersede the previous green/cream one-page design. Background treatments, square image boundaries, white space, central lineup, garment silhouettes and side-profile poses were reconstructed from the screenshots. The image tool rejected the sheer-dress generation; opaque jewel-toned dresses retain the long silhouette and profile arrangement. No pixel-exact claim is made. Browser visual testing was unavailable; see `docs/verification.md`.

All imagery is generated fashion concept work, not verified product photography. Product names and EUR prices are illustrative. Fabric specifications, fit, stock, shipping, payment, orders and customer accounts require real integrations before commerce launch. No purchases are processed. The working brand name is not legally cleared.

## Validate
```sh
node --check dist/app.js
node --check dist/catalog.js
node tests/catalog.test.cjs
```
