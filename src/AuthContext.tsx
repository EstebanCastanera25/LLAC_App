import React, { createContext, useContext, useEffect, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { getAuth0Client, startLogin, IS_NATIVE, Browser } from './auth0';
import {
  getTenantHeaders,
  postJson,
  putJson,
  getJson,
  setToken as persistToken,
  clearToken,
} from './utils/api';
import { getConfig } from './config';

export type AppEstado = 'pendiente' | 'aprobado' | 'rechazado';

export interface AppUser {
  _id?: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  dni?: string;
  fechaNacimiento?: string;
  genero?: string;
  ocupacion?: string;
  profesion?: string;
  domicilio?: string;
  provincia?: string;
  localidad?: string;
  barrio?: string;
  estado: AppEstado;
  perfiles: string[];
  perfilCompleto: boolean;
  comunaId?: string | null;
  fotoUrl?: string;
}

/** Campos editables del perfil (nombre/apellido/telefono obligatorios). */
export interface ProfileInput {
  nombre: string;
  apellido: string;
  telefono: string;
  dni?: string;
  fechaNacimiento?: string;
  genero?: string;
  ocupacion?: string;
  profesion?: string;
  domicilio?: string;
  provincia?: string;
  localidad?: string;
  barrio?: string;
}

export interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  esFiscal: boolean;
  fiscalizacionEnabled: boolean;
  loginWithGoogle: () => Promise<void>;
  updateProfile: (data: ProfileInput) => Promise<AppUser>;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
  /** Ruta destino según el estado del usuario (gate de navegación). */
  homeRoute: () => string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'appUser';

type ExchangeResponse = { data?: AppUser & { token?: string } } & Partial<AppUser & { token?: string }>;

function pickUserAndToken(payload: unknown): { user: AppUser; token: string } | null {
  const p = (payload as ExchangeResponse) || {};
  const d = (p.data ?? p) as AppUser & { token?: string };
  if (!d || !d.token || !d.email) return null;
  const { token, ...user } = d;
  return { user: user as AppUser, token };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = (u: AppUser, t: string) => {
    setUser(u);
    setTokenState(t);
    persistToken(t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  const clearSession = () => {
    setUser(null);
    setTokenState(null);
    clearToken();
    localStorage.removeItem(USER_KEY);
  };

  // Intercambia el access_token de Auth0 por el JWT propio de la app.
  const exchange = async (): Promise<void> => {
    const client = await getAuth0Client();
    const accessToken = await client.getTokenSilently();
    const r = await postJson('/api/app/auth/auth0', { token: accessToken }, getTenantHeaders());
    if (!r.ok) {
      const msg = typeof r.payload === 'string'
        ? r.payload
        : (r.payload as { mensaje?: string })?.mensaje || `Error ${r.status}`;
      throw new Error(msg);
    }
    const picked = pickUserAndToken(r.payload);
    if (!picked) throw new Error('Respuesta de login inválida');
    persist(picked.user, picked.token);
  };

  // Restauración inicial + manejo de callback de Auth0.
  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      // 1) sesión guardada
      const storedUser = localStorage.getItem(USER_KEY);
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setTokenState(storedToken);
        } catch {
          clearSession();
        }
      }

      // 2) callback web (?code=&state=)
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.has('code') && params.has('state')) {
          const client = await getAuth0Client();
          await client.handleRedirectCallback();
          window.history.replaceState({}, document.title, window.location.pathname);
          await exchange();
        }
      } catch (e) {
        console.warn('[auth] callback web falló', e);
      }

      // 3) callback nativo (deep link)
      if (IS_NATIVE) {
        const handle = await CapApp.addListener('appUrlOpen', async ({ url }) => {
          if (url && url.includes('state') && (url.includes('code') || url.includes('error'))) {
            try {
              const client = await getAuth0Client();
              await client.handleRedirectCallback(url);
              await Browser.close();
              await exchange();
            } catch (e) {
              console.warn('[auth] callback nativo falló', e);
            }
          }
        });
        unsub = () => handle.remove();
      }

      setLoading(false);
    })();

    return () => { if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginWithGoogle = async () => {
    await startLogin();
  };

  const updateProfile = async (data: ProfileInput): Promise<AppUser> => {
    const r = await putJson('/api/app/me', data, getTenantHeaders());
    if (!r.ok) {
      const msg = typeof r.payload === 'string'
        ? r.payload
        : (r.payload as { mensaje?: string })?.mensaje || `Error ${r.status}`;
      throw new Error(msg);
    }
    const picked = pickUserAndToken(r.payload);
    if (!picked) throw new Error('Respuesta inválida al actualizar perfil');
    persist(picked.user, picked.token);
    return picked.user;
  };

  const refreshMe = async () => {
    const r = await getJson('/api/app/me', getTenantHeaders());
    if (r.ok) {
      const d = (r.payload as { data?: AppUser })?.data;
      if (d && token) persist(d, token);
    }
  };

  const logout = async () => {
    clearSession();
    try {
      const client = await getAuth0Client();
      const returnTo = getConfig().auth0Callback || window.location.origin;
      if (IS_NATIVE) {
        await client.logout({ logoutParams: { returnTo }, openUrl: async (url) => { await Browser.open({ url }); } });
      } else {
        await client.logout({ logoutParams: { returnTo } });
      }
    } catch {
      // sesión local ya limpiada
    }
  };

  const homeRoute = (): string => {
    if (!user || !token) return '/login';
    if (!user.perfilCompleto) return '/completar-perfil';
    if (user.estado !== 'aprobado') return '/pendiente';
    // Con una sola opción (sin modo fiscalización), entra directo a Comuna.
    const dosModos = getConfig().fiscalizacionEnabled && !!user.perfiles?.includes('fiscal');
    return dosModos ? '/inicio' : '/comuna';
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    esFiscal: !!user?.perfiles?.includes('fiscal'),
    fiscalizacionEnabled: getConfig().fiscalizacionEnabled,
    loginWithGoogle,
    updateProfile,
    refreshMe,
    logout,
    homeRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
}
