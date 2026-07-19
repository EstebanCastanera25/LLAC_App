import { getJson, postJson, getTenantHeaders } from '../utils/api';

export type MiSolicitud = 'ninguna' | 'pendiente' | 'aprobado' | 'rechazado';

export interface GrupoApp {
  id: string;
  nombre: string;
  yaMiembro: boolean;
  miSolicitud: MiSolicitud;
}

export interface PerfilGrupos {
  completo: boolean;
  faltan: string[];        // etiquetas de campos faltantes para poder sumarse
}

export interface GruposResp {
  grupos: GrupoApp[];
  perfil: PerfilGrupos;
}

const VACIO: GruposResp = { grupos: [], perfil: { completo: false, faltan: [] } };

function mensajeError(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload) return payload;
  return (payload as { mensaje?: string })?.mensaje || `Error ${status}`;
}

/** Grupos publicados de la comuna + estado del usuario + completitud de su perfil. */
export async function getGrupos(): Promise<GruposResp> {
  const r = await getJson('/api/app/grupos', getTenantHeaders());
  if (!r.ok) throw new Error(mensajeError(r.payload, r.status));
  const d = (r.payload as { data?: GruposResp })?.data;
  return d ?? VACIO;
}

export interface SolicitarResp { estado: MiSolicitud }

/** Error de solicitud con la lista de campos faltantes (cuando el perfil está incompleto). */
export interface SolicitarError extends Error { faltan?: string[] }

export async function solicitarGrupo(grupoId: string): Promise<SolicitarResp> {
  const r = await postJson('/api/app/grupos/solicitar', { grupoId }, getTenantHeaders());
  if (!r.ok) {
    const faltan = (r.payload as { data?: { faltan?: string[] } })?.data?.faltan;
    const err = new Error(mensajeError(r.payload, r.status)) as SolicitarError;
    if (faltan) err.faltan = faltan;
    throw err;
  }
  return (r.payload as { data?: SolicitarResp })?.data ?? { estado: 'pendiente' };
}
