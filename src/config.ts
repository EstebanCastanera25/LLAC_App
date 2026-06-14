/**
 * Configuración de runtime de la app.
 *
 * La app lee su config del backend al arrancar (`GET /api/app/config`), así se
 * puede editar desde el panel (APP → Configuración) sin recompilar. Lo único que
 * queda en build-time es `VITE_API_BASE` (dónde está el backend). Las demás
 * `VITE_*` quedan solo como fallback si el backend no responde.
 */
export interface RuntimeConfig {
  auth0Domain: string;
  auth0ClientId: string;
  auth0Callback: string;
  defaultComunaId: string;
  fiscalizacionEnabled: boolean;
}

const API_BASE = (import.meta.env.VITE_API_BASE || '')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

const STORAGE_KEY = 'appConfig';

function envFallback(): RuntimeConfig {
  return {
    auth0Domain: (import.meta.env.VITE_AUTH0_DOMAIN as string) || '',
    auth0ClientId: (import.meta.env.VITE_AUTH0_CLIENT_ID as string) || '',
    auth0Callback:
      (import.meta.env.VITE_AUTH0_CALLBACK as string) ||
      (typeof window !== 'undefined' ? window.location.origin : ''),
    defaultComunaId: (import.meta.env.VITE_DEFAULT_COMUNA_ID as string) || '',
    fiscalizacionEnabled: String(import.meta.env.VITE_FISCALIZACION_ENABLED) === 'true',
  };
}

function readCache(): RuntimeConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RuntimeConfig) : null;
  } catch {
    return null;
  }
}

// Inicialización síncrona: última config conocida (cache) o fallback de env.
let current: RuntimeConfig = readCache() ?? envFallback();

/** Config actual (síncrona; siempre devuelve algo). */
export function getConfig(): RuntimeConfig {
  return current;
}

/** Refresca la config desde el backend. Best-effort: si falla, mantiene el fallback. */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const url = `${API_BASE}/api/app/config`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (resp.ok) {
      const json = await resp.json();
      const d = (json?.data ?? json) as Partial<RuntimeConfig>;
      current = {
        auth0Domain: d.auth0Domain || current.auth0Domain,
        auth0ClientId: d.auth0ClientId || current.auth0ClientId,
        auth0Callback:
          d.auth0Callback ||
          current.auth0Callback ||
          (typeof window !== 'undefined' ? window.location.origin : ''),
        defaultComunaId: d.defaultComunaId || current.defaultComunaId,
        fiscalizacionEnabled:
          typeof d.fiscalizacionEnabled === 'boolean'
            ? d.fiscalizacionEnabled
            : current.fiscalizacionEnabled,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      } catch {
        /* noop */
      }
    }
  } catch {
    /* mantener fallback */
  }
  return current;
}
