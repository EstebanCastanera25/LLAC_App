import { getJson, getTenantHeaders } from '../utils/api';

export interface Sede {
  direccion: string;
  telefono: string;
  email: string;
  horarios: string;
  lat: number | null;
  lng: number | null;
}

export interface InicioReferente {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
}

export interface InicioEvento {
  titulo: string;
  descripcion: string;
  inicio: string;
  ubicacion: string;
  direccion: string;
  geo: { lat: number; lng: number } | null;
  linkRegistro: string;
}

export interface InicioNoticia {
  title: string;
  description: string;
  image: string;
  date: string | null;
  slug: string;
  socialLinks: { platform: string; url: string }[];
}

export interface InicioData {
  comuna: { nombre: string; numero: number; branding: { logoUrl?: string; colorPrimario?: string; tagline?: string } } | null;
  referente: InicioReferente | null;
  sede: Sede;
  redes: { instagram: string; twitter: string; mail: string };
  eventos: InicioEvento[];
  noticias: InicioNoticia[];
  misReclamosAbiertos: number;
}

const VACIO: InicioData = {
  comuna: null,
  referente: null,
  sede: { direccion: '', telefono: '', email: '', horarios: '', lat: null, lng: null },
  redes: { instagram: '', twitter: '', mail: '' },
  eventos: [],
  noticias: [],
  misReclamosAbiertos: 0,
};

export async function getInicio(): Promise<InicioData> {
  const r = await getJson('/api/app/inicio', getTenantHeaders());
  if (!r.ok) {
    const msg = typeof r.payload === 'string' ? r.payload : (r.payload as { mensaje?: string })?.mensaje || `Error ${r.status}`;
    throw new Error(msg);
  }
  const d = (r.payload as { data?: InicioData })?.data;
  return d ?? VACIO;
}
