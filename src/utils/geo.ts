/**
 * Utilidades geográficas del front (mapa de circuitos).
 * El GeoJSON oficial se sirve estático desde `public/geo/caba-circuitos.geojson`.
 */

export type GeoFeature = {
  type: 'Feature';
  properties: { COMUNA: number; ID: string; BARRIO?: string };
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
};

/** Forma canónica del número de circuito (espeja helpers/numeroCircuito.js del backend). */
export function canonizarNumeroCircuito(raw: string | number): string {
  const t = String(raw ?? '').trim();
  if (!t) return '';
  if (/^\d+$/.test(t)) return String(parseInt(t, 10)).padStart(3, '0');
  return t;
}

let _cache: GeoFeature[] | null = null;

async function cargarFeatures(): Promise<GeoFeature[]> {
  if (_cache) return _cache;
  const resp = await fetch('/geo/caba-circuitos.geojson');
  if (!resp.ok) throw new Error(`No se pudo cargar el mapa (${resp.status})`);
  const gj = await resp.json();
  const feats: GeoFeature[] = Array.isArray(gj?.features) ? gj.features : [];
  _cache = feats;
  return feats;
}

/** Feature del circuito (por COMUNA + ID canonizado) o null. */
export async function fetchCircuitoFeature(
  comunaNumero: number | null,
  circuitoNumero: string,
): Promise<GeoFeature | null> {
  if (comunaNumero == null) return null;
  const num = canonizarNumeroCircuito(circuitoNumero);
  const feats = await cargarFeatures();
  return (
    feats.find(
      (f) => Number(f.properties?.COMUNA) === Number(comunaNumero) && canonizarNumeroCircuito(f.properties?.ID) === num,
    ) || null
  );
}

/** Todos los features (circuitos) de una comuna. */
export async function fetchComunaFeatures(comunaNumero: number | null): Promise<GeoFeature[]> {
  if (comunaNumero == null) return [];
  const feats = await cargarFeatures();
  return feats.filter((f) => Number(f.properties?.COMUNA) === Number(comunaNumero));
}

/** Bounds [[south, west], [north, east]] de un conjunto de features (null si vacío). */
export function featuresBounds(features: GeoFeature[]): [[number, number], [number, number]] | null {
  if (!features.length) return null;
  let minLat = 90;
  let minLng = 180;
  let maxLat = -90;
  let maxLng = -180;
  for (const f of features) {
    const [[s, w], [n, e]] = featureBounds(f);
    if (s < minLat) minLat = s;
    if (w < minLng) minLng = w;
    if (n > maxLat) maxLat = n;
    if (e > maxLng) maxLng = e;
  }
  return [[minLat, minLng], [maxLat, maxLng]];
}

/** Bounds [[south, west], [north, east]] del feature. */
export function featureBounds(feature: GeoFeature): [[number, number], [number, number]] {
  let minLat = 90;
  let minLng = 180;
  let maxLat = -90;
  let maxLng = -180;
  const visitRing = (ring: number[][]) => {
    for (const [lng, lat] of ring) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
  };
  const g = feature.geometry;
  if (g.type === 'Polygon') {
    (g.coordinates as number[][][]).forEach(visitRing);
  } else {
    (g.coordinates as number[][][][]).forEach((poly) => poly.forEach(visitRing));
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}
