/* eslint-disable */
// Variantes de la propuesta B (degradé violeta) con distintos tamaños de águila.
//   NODE_PATH="../LLAC_back/node_modules" node scripts/gen-iconos-B.cjs
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public', 'assets', 'icon-lla.png');
const OUT = path.resolve(ROOT, '..', 'LLA diseños', 'Iconos app propuestas');
const SIZE = 1024;
const V1 = '#371858', V2 = '#5a2d8a';

fs.mkdirSync(OUT, { recursive: true });

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
function maskRedondeado(size) {
  const r = Math.round(size * 0.22);
  return Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`);
}
async function fondoDegrade(size) {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${V1}"/><stop offset="1" stop-color="${V2}"/></linearGradient></defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

(async () => {
  for (const frac of [0.80, 0.88]) {
    const aguila = await aguilaBlanca(SIZE, Math.round(SIZE * frac));
    const full = await sharp(await fondoDegrade(SIZE)).composite([{ input: aguila, top: 0, left: 0 }]).png().toBuffer();
    const prev = await sharp(full).composite([{ input: maskRedondeado(SIZE), blend: 'dest-in' }]).png().toBuffer();
    const name = `propuesta-B-degrade-aguila-${Math.round(frac * 100)}.png`;
    await fs.promises.writeFile(path.join(OUT, name), prev);
    console.log('OK →', name);
  }
})().catch((e) => { console.error(e); process.exit(1); });
