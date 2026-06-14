/* eslint-disable */
// Integra la propuesta B (águila blanca grande, sobre degradé violeta) como ícono de la app.
// Android: foreground transparente (águila) + fondo gradiente (drawable XML, ver ic_launcher.xml).
// Legacy + PWA: gradiente bakeado. Ejecutar:
//   NODE_PATH="../LLAC_back/node_modules" node scripts/gen-iconos-integrar.cjs
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');                 // LLAC_App
const SRC = path.join(ROOT, 'public', 'assets', 'icon-lla.png');
const ASSETS = path.join(ROOT, 'public', 'assets');
const DESIGNS = path.resolve(ROOT, '..', 'LLA diseños', 'Iconos app propuestas');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

const V1 = '#371858', V2 = '#5a2d8a';
const EAGLE_FULL = 0.88;  // legacy / PWA "any" / favicon (OS solo redondea esquinas)
const EAGLE_MASK = 0.66;  // PWA maskable (zona segura 80%)
const EAGLE_FG = 0.66;    // Android adaptive foreground (zona segura, sin recortar alas)

const FG = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const LG = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

async function aguilaBlanca(box, target) {
  const alpha = await sharp(SRC).ensureAlpha()
    .resize(target, target, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extractChannel('alpha').toBuffer();
  const blanca = await sharp({ create: { width: target, height: target, channels: 3, background: '#ffffff' } })
    .joinChannel(alpha).png().toBuffer();
  const pad = Math.round((box - target) / 2);
  return sharp({ create: { width: box, height: box, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: blanca, top: pad, left: pad }]).png().toBuffer();
}
async function fondoDegrade(size) {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${V1}"/><stop offset="1" stop-color="${V2}"/></linearGradient></defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
/** Ícono full-bleed: degradé + águila (frac del lado). */
async function iconoLleno(size, frac) {
  const aguila = await aguilaBlanca(size, Math.round(size * frac));
  return sharp(await fondoDegrade(size)).composite([{ input: aguila, top: 0, left: 0 }]).png().toBuffer();
}
function circuloMask(size) {
  const r = size / 2;
  return Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}"/></svg>`);
}
async function write(p, buf) { fs.mkdirSync(path.dirname(p), { recursive: true }); await fs.promises.writeFile(p, buf); console.log('OK', path.relative(ROOT, p)); }

(async () => {
  // Android adaptive foreground: SOLO águila blanca sobre transparente (el degradé va de fondo).
  for (const [dpi, px] of Object.entries(FG)) {
    await write(path.join(RES, `mipmap-${dpi}`, 'ic_launcher_foreground.png'), await aguilaBlanca(px, Math.round(px * EAGLE_FG)));
  }
  // Android legacy (square + round) con degradé bakeado.
  for (const [dpi, px] of Object.entries(LG)) {
    const sq = await iconoLleno(px, EAGLE_FULL);
    await write(path.join(RES, `mipmap-${dpi}`, 'ic_launcher.png'), sq);
    const round = await sharp(sq).composite([{ input: circuloMask(px), blend: 'dest-in' }]).png().toBuffer();
    await write(path.join(RES, `mipmap-${dpi}`, 'ic_launcher_round.png'), round);
  }
  // PWA / web
  await write(path.join(ASSETS, 'app-icon-512.png'), await iconoLleno(512, EAGLE_FULL));
  await write(path.join(ASSETS, 'app-icon-maskable-512.png'), await iconoLleno(512, EAGLE_MASK));
  await write(path.join(ASSETS, 'favicon.png'), await iconoLleno(64, EAGLE_FULL));
  // Master
  await write(path.join(DESIGNS, 'icono-final-B-master-1024.png'), await iconoLleno(1024, EAGLE_FULL));

  console.log('\nListo.');
})().catch((e) => { console.error(e); process.exit(1); });
