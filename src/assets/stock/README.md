# Stock photography

Drop real category photos here to turn on photography across Kaira **with no code
changes**. They are bundled at build time, so they work everywhere — production,
offline, and the single-file preview.

## How

Create a folder named after the product **kind** and add images:

```
src/assets/stock/
  car/        car-1.jpg  car-2.jpg  car-3.jpg
  home/       house-1.jpg …
  building2/  apartment-1.jpg …
  smartphone/ phone-1.jpg …
  laptop/     …
  tv/         …
  gamepad2/   …
  camera/     …
  footprints/ sneakers-1.jpg …   (fashion → shoes)
  shoppingbag/ bag-1.jpg …       (fashion → bags)
  watch/      …
  shirt/      …                  (fashion → clothing)
  dog/  cat/  bird/  pawprint/    (pets)
  trees/      land-1.jpg …       (property → plots/land)
  sailboat/   boat-1.jpg …
  briefcase/  jobs-1.jpg …
  wrench/     services-1.jpg …
  armchair/   furniture-1.jpg …
  gem/        collectibles-1.jpg …
```

The `kind` values come from `resolveKind()` in `src/lib/media.js` — add several
images per folder so the same photo isn't repeated across listings.

## Priority

Seller-uploaded photos always win. These stock images are only used when a
listing has no photo of its own. If a folder is empty, that category shows the
branded Kaira placeholder instead.

## Recommended

- ~1200px wide, JPEG/WebP, ~70% quality (keep each file well under ~200 KB).
- Consistent, well-lit product shots. Landscape or square crop.
- Use royalty-free sources you have rights to (Unsplash, Pexels, your own).
