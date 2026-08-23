// Bundled stock photography, auto-discovered at build time.
//
// Drop real photos into  src/assets/stock/<kind>/*.{jpg,jpeg,png,webp}
// and they are bundled and used automatically as category fallbacks — no code
// changes. `<kind>` is the product glyph key from lib/media.js resolveKind()
// (e.g. car, home, building2, smartphone, laptop, tv, footprints, dog, cat…).
//
// Seller-uploaded photos still take priority over these; these only fill in when
// a listing has no photo of its own. Empty by default → branded placeholders.

const modules = import.meta.glob('../assets/stock/**/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});

export const STOCK = {};
for (const [path, url] of Object.entries(modules)) {
  const m = path.match(/stock\/([^/]+)\//);
  if (!m) continue;
  const kind = m[1];
  (STOCK[kind] ||= []).push(url);
}
