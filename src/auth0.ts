import { createAuth0Client, Auth0Client } from '@auth0/auth0-spa-js';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { getConfig, loadRuntimeConfig } from './config';

export const IS_NATIVE = Capacitor.isNativePlatform();

/** redirect_uri: web usa el origin; nativo usa el callback configurado (deep link). */
function redirectUri(): string {
  const cfg = getConfig();
  if (IS_NATIVE) return cfg.auth0Callback || '';
  return typeof window !== 'undefined' ? window.location.origin : cfg.auth0Callback || '';
}

let clientPromise: Promise<Auth0Client> | null = null;

/** Singleton del cliente Auth0 (creado con la config runtime). */
export function getAuth0Client(): Promise<Auth0Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      await loadRuntimeConfig(); // asegura domain/clientId frescos
      const cfg = getConfig();
      return createAuth0Client({
        domain: cfg.auth0Domain,
        clientId: cfg.auth0ClientId,
        authorizationParams: {
          redirect_uri: redirectUri(),
          scope: 'openid profile email',
        },
        useRefreshTokens: true,
        cacheLocation: 'localstorage',
      });
    })();
  }
  return clientPromise;
}

/**
 * Dispara el login con Google a través de Auth0.
 * Web: redirect estándar. Capacitor: abre la URL en el navegador del sistema
 * (el callback vuelve por deep link → lo captura `appUrlOpen` en AuthContext).
 */
export async function startLogin(): Promise<void> {
  const client = await getAuth0Client();
  const authorizationParams = { connection: 'google-oauth2' as const };

  if (IS_NATIVE) {
    await client.loginWithRedirect({
      authorizationParams,
      openUrl: async (url: string) => {
        await Browser.open({ url, windowName: '_self' });
      },
    });
  } else {
    await client.loginWithRedirect({ authorizationParams });
  }
}

export { Browser };
