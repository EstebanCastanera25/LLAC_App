import { buildUrl, getJson, getTenantHeaders } from '../utils/api';

/** Tipos del "modo Coordinación" (endpoints /api/app/coordinacion y /api/app/reclamos). */
export interface CoordCircuitoCoordinador {
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  esVos: boolean;
}

export interface CoordCircuito {
  _id: string;
  numero: string;
  nombre: string;
  comunaNumero: number | null;
  cantMiembros: number;
  coordinadores: CoordCircuitoCoordinador[];
}

export interface CircuitoMiembro {
  _id: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  barrio: string;
  coordenadas: { lat: number; lng: number } | null;
}

export interface Reclamo {
  _id: string;
  codigo: string;
  descripcion: string;
  estado: 'abierto' | 'en_curso' | 'enviado' | 'resuelto';
  fotos: string[];
  ubicacion: { lat: number; lng: number; direccion: string };
  circuitoNumero: string;
  createdAt: string;
  creadoPor?: { nombre?: string; email?: string; appUsuarioId?: string };
}

export interface ReclamosResp {
  comunaNumero: number | null;
  esCoordinador: boolean;
  esAdmin: boolean;
  reclamos: Reclamo[];
}

export interface ReverseGeocode {
  direccion: string;
  display_name: string;
  barrio: string;
}

export interface CircuitosResumen {
  totalCircuitos: number;
  totalCoordinadores: number;
  totalMiembros: number;
  circuitos: (CoordCircuito & { cantCoordinadores: number })[];
}

type ApiData<T> = { data?: T };

function unwrap<T>(payload: unknown, fallback: T): T {
  const d = (payload as ApiData<T>)?.data;
  return (d ?? fallback) as T;
}

export async function getCoordinacionEstado(): Promise<{ esCoordinador: boolean; cantCircuitos: number; esAdminComuna: boolean }> {
  const fallback = { esCoordinador: false, cantCircuitos: 0, esAdminComuna: false };
  const r = await getJson('/api/app/coordinacion/estado', getTenantHeaders());
  if (!r.ok) return fallback;
  return unwrap(r.payload, fallback);
}

export async function getMisCircuitos(): Promise<CoordCircuito[]> {
  const r = await getJson('/api/app/coordinacion/mis-circuitos', getTenantHeaders());
  if (!r.ok) throw new Error(mensajeError(r.payload, r.status));
  return unwrap<CoordCircuito[]>(r.payload, []);
}

export async function getTodosCircuitos(): Promise<CircuitosResumen> {
  const r = await getJson('/api/app/coordinacion/todos-circuitos', getTenantHeaders());
  if (!r.ok) throw new Error(mensajeError(r.payload, r.status));
  return unwrap<CircuitosResumen>(r.payload, {
    totalCircuitos: 0, totalCoordinadores: 0, totalMiembros: 0, circuitos: [],
  });
}

export async function getCircuito(circuitoId: string): Promise<CoordCircuito> {
  const r = await getJson(`/api/app/coordinacion/circuitos/${circuitoId}`, getTenantHeaders());
  if (!r.ok) throw new Error(mensajeError(r.payload, r.status));
  return unwrap<CoordCircuito>(r.payload, {} as CoordCircuito);
}

export async function getMiembrosDeCircuito(circuitoId: string): Promise<CircuitoMiembro[]> {
  const r = await getJson(`/api/app/coordinacion/circuitos/${circuitoId}/miembros`, getTenantHeaders());
  if (!r.ok) throw new Error(mensajeError(r.payload, r.status));
  return unwrap<CircuitoMiembro[]>(r.payload, []);
}

/** Listado de reclamos según rol (miembro=propios, coordinador=circuito, admin=comuna). */
export async function getReclamos(): Promise<ReclamosResp> {
  const r = await getJson('/api/app/reclamos', getTenantHeaders());
  if (!r.ok) throw new Error(mensajeError(r.payload, r.status));
  return unwrap<ReclamosResp>(r.payload, { comunaNumero: null, esCoordinador: false, esAdmin: false, reclamos: [] });
}

/** Contexto mínimo para crear un reclamo (número de comuna para centrar el mapa). */
export async function getReclamosContexto(): Promise<{ comunaNumero: number | null }> {
  const r = await getJson('/api/app/reclamos/contexto', getTenantHeaders());
  if (!r.ok) throw new Error(mensajeError(r.payload, r.status));
  return unwrap<{ comunaNumero: number | null }>(r.payload, { comunaNumero: null });
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocode> {
  const r = await getJson(
    `/api/app/reclamos/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
    getTenantHeaders(),
  );
  if (!r.ok) throw new Error(mensajeError(r.payload, r.status));
  return unwrap<ReverseGeocode>(r.payload, { direccion: '', display_name: '', barrio: '' });
}

/**
 * Geocoding directo: dirección → coordenadas (acotado a CABA).
 * Devuelve null SOLO cuando no hay match (404 con cuerpo JSON de nuestro controller).
 * Cualquier otro fallo (401/500/502 o ruta ausente → 404 HTML) lanza el error real,
 * para no disfrazar un backend caído/desactualizado de "dirección no encontrada".
 */
export async function geocodeAddress(q: string): Promise<{ lat: number; lng: number; direccion: string } | null> {
  const r = await getJson(`/api/app/reclamos/geocode?q=${encodeURIComponent(q)}`, getTenantHeaders());
  if (!r.ok) {
    const noMatch = r.status === 404 && typeof r.payload !== 'string';
    if (noMatch) return null;
    throw new Error(mensajeError(r.payload, r.status));
  }
  return (r.payload as ApiData<{ lat: number; lng: number; direccion: string }>)?.data ?? null;
}

/** Crea un reclamo (multipart). No seteamos Content-Type: el browser arma el boundary.
 *  El circuito lo detecta el backend por la ubicación (no se envía circuitoId). */
export async function crearReclamo(input: {
  file: Blob;
  descripcion: string;
  lat: number;
  lng: number;
  direccion: string;
}): Promise<Reclamo> {
  const fd = new FormData();
  fd.append('file', input.file, 'reclamo.jpg');
  fd.append('descripcion', input.descripcion);
  fd.append('lat', String(input.lat));
  fd.append('lng', String(input.lng));
  fd.append('direccion', input.direccion);

  const resp = await fetch(buildUrl('/api/app/reclamos'), {
    method: 'POST',
    headers: getTenantHeaders({ Accept: 'application/json' }),
    body: fd,
  });
  const ct = resp.headers.get('content-type') || '';
  const payload = ct.includes('application/json') ? await resp.json() : await resp.text();
  if (!resp.ok) throw new Error(mensajeError(payload, resp.status));
  return unwrap<Reclamo>(payload, {} as Reclamo);
}

function mensajeError(payload: unknown, status: number): string {
  if (typeof payload === 'string') return payload || `Error ${status}`;
  return (payload as { mensaje?: string })?.mensaje || `Error ${status}`;
}
