import { getJson, postJson, getTenantHeaders } from '../utils/api';

export interface Notif {
  id: string;
  tipo: 'perfil' | 'evento' | 'reclamo' | 'noticia' | string;
  titulo: string;
  detalle: string;
  fecha: string | null;
  link: string;
  icono: string;
  leida: boolean;
  permanente?: boolean;
}

export interface NotifResp {
  items: Notif[];
  noLeidas: number;
}

const VACIO: NotifResp = { items: [], noLeidas: 0 };

/** Nunca rompe el header: ante error devuelve vacío. */
export async function getNotificaciones(): Promise<NotifResp> {
  try {
    const r = await getJson('/api/app/notificaciones', getTenantHeaders());
    if (!r.ok) return VACIO;
    return (r.payload as { data?: NotifResp })?.data ?? VACIO;
  } catch {
    return VACIO;
  }
}

export async function marcarLeidas(): Promise<void> {
  try {
    await postJson('/api/app/notificaciones/marcar-leidas', {}, getTenantHeaders());
  } catch {
    /* best-effort */
  }
}
