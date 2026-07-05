import { getJson, postJson, delJson, getTenantHeaders } from '../utils/api';

export interface Evento {
  _id: string;
  nombre: string;
  tipo: string;
  fecha: string;              // ISO date
  descripcion: string;
  audiencia: 'PUBLICO' | 'MIEMBROS' | 'COORDINADORES' | 'GRUPO' | string;
  grupoNombre?: string | null;
  linkInscripcion?: string;
  slug?: string | null;
  anotado?: boolean;
  puedeDesanotar?: boolean;
}

function mensajeError(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload) return payload;
  return (payload as { mensaje?: string })?.mensaje || `Error ${status}`;
}

export interface AnotarResp { anotado: boolean; totalParticipantes: number }

export interface EventosResp {
  eventos: Evento[];
  proximos: boolean;         // false = no hay próximos, se muestran los más recientes
  esCoordinador: boolean;
  esAdmin: boolean;          // admin de comuna/global → ve todos los eventos
}

const VACIO: EventosResp = { eventos: [], proximos: true, esCoordinador: false, esAdmin: false };

export async function getEventos(): Promise<EventosResp> {
  const r = await getJson('/api/app/eventos', getTenantHeaders());
  if (!r.ok) {
    const msg = typeof r.payload === 'string'
      ? r.payload
      : (r.payload as { mensaje?: string })?.mensaje || `Error ${r.status}`;
    throw new Error(msg);
  }
  const d = (r.payload as { data?: EventosResp })?.data;
  return d ?? VACIO;
}

export async function anotarse(id: string): Promise<AnotarResp> {
  const r = await postJson(`/api/app/eventos/${id}/anotarse`, {}, getTenantHeaders());
  if (!r.ok) throw new Error(mensajeError(r.payload, r.status));
  return (r.payload as { data?: AnotarResp })?.data ?? { anotado: true, totalParticipantes: 0 };
}

export async function desanotarse(id: string): Promise<AnotarResp> {
  const r = await delJson(`/api/app/eventos/${id}/anotarse`, getTenantHeaders());
  if (!r.ok) throw new Error(mensajeError(r.payload, r.status));
  return (r.payload as { data?: AnotarResp })?.data ?? { anotado: false, totalParticipantes: 0 };
}
