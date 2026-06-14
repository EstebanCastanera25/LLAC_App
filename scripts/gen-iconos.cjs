/* eslint-disable */
// Genera mockups de ícono de app LLA Comuna 7 a partir del águila existente.
// Ejecutar con sharp resuelto desde LLAC_back:
//   NODE_PATH="../LLAC_back/node_modules" node scripts/gen-iconos.cjs
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');               // LLAC_App
const SRC = path.join(ROOT, 'public', 'assets', 'icon-lla.png');
const OUT = path.resolve(ROOT, '..', 'LLA diseños', 'Iconos app propuestas');

const SIZE = 1024;
const VIOLETA = '#371858';
const VIOLETA2 = '#5a2d8a';

fs.mkdirSync(OUT, { recursive: true });

/** Águila blanca (RGBA) escalada a `target` px de lado mayor, sobre lienzo transparente `box`×`box`. */
async function aguilaBlanca(box, target) {
  // 1) máscara alfa del águila, redimensionada
  const alpha = await sharp(SRC)
    .ensureAlpha()
    .resize(target, target, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extractChannel('alpha')
    .toBuffer();
  // 2) lienzo blanco target×target + ese alfa como canal alpha → águila blanca
  const blanca = await sharp({
    create: { width: target, height: target, channels: 3, background: '#ffffff' },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();
  // 3) centrar en una caja box×box transparente
  const pad = Math.round((box - target) / 2);
  return sharp({
    create: { width: box, height: box, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: blanca, top: pad, left: pad }])
    .png()
    .toBuffer();
}

/** Esquinas redondeadas (preview estilo celular). */
function maskRedondeado(size, radius) {
  const r = radius ?? Math.round(size * 0.22);
  return Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`
  );
}

async function fondoSolido(size, color) {
  return sharp({ create: { width: size, height: size, channels: 4, background: color } }).png().toBuffer();
}

async function fondoDegrade(size) {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${VIOLETA}"/><stop offset="1" stop-color="${VIOLETA2}"/>
    </linearGradient></defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function anilloSvg(size) {
  const cx = size / 2;
  const stroke = Math.round(size * 0.018);
  const r = Math.round(size * 0.40);
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
       <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="#ffffff" stroke-width="${stroke}"/>
     </svg>`
  );
}

async function componer(nombre, fondoBuf, capas, target) {
  const aguila = await aguilaBlanca(SIZE, target);
  const layers = [...capas, { input: aguila, top: 0, left: 0 }];
  // ícono full-bleed
  const full = await sharp(fondoBuf).composite(layers).png().toBuffer();
  // preview redondeado
  const prev = await sharp(full)
    .composite([{ input: maskRedondeado(SIZE), blend: 'dest-in' }])
    .png()
    .toBuffer();
  await fs.promises.writeFile(path.join(OUT, `${nombre}.png`), prev);
  console.log('OK →', path.join(OUT, `${nombre}.png`));
}

(async () => {
  // A — sólido
  await componer('propuesta-A-solido', await fondoSolido(SIZE, VIOLETA), [], Math.round(SIZE * 0.70));
  // B — degradé
  await componer('propuesta-B-degrade', await fondoDegrade(SIZE), [], Math.round(SIZE * 0.70));
  // C — anillo (águila un poco más chica para entrar en el aro)
  await componer('propuesta-C-anillo', await fondoSolido(SIZE, VIOLETA), [{ input: anilloSvg(SIZE), top: 0, left: 0 }], Math.round(SIZE * 0.58));
  console.log('\nListo. Carpeta:', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
