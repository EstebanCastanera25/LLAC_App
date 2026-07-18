import { putJson, getTenantHeaders } from '../utils/api';

/** Jornada electoral: el fiscal marca/desmarca SU presente (requiere DNI en Mi Perfil). */
export async function marcarPresente(fiscalizacionId: string, presente: boolean) {
  return putJson('/api/app/fiscalizacion/presente', { fiscalizacionId, presente }, getTenantHeaders());
}

/** El fiscal general marca que su establecimiento recibió la comida. */
export async function marcarRecibioViveres(fiscalizacionId: string, recibido: boolean) {
  return putJson('/api/app/fiscalizacion/recibio-viveres', { fiscalizacionId, recibido }, getTenantHeaders());
}
