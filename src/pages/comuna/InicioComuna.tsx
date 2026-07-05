import React, { useCallback, useState } from 'react';
import {
  IonContent, IonSpinner, IonText, IonList, IonItem, IonLabel, IonNote, IonButton, IonIcon,
  IonCard, IonCardContent, IonImg, IonBadge, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  locationOutline, timeOutline, callOutline, navigateOutline, addOutline, megaphoneOutline,
  calendarOutline, newspaperOutline, logoInstagram, logoTwitter, mailOutline,
  personOutline, closeOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Layout from '../../components/Layout';
import ContactoAcciones from '../../components/ContactoAcciones';
import { useAuth } from '../../AuthContext';
import { getInicio, type InicioData, type InicioNoticia } from '../../services/inicio';
import { getEventos, type Evento } from '../../services/eventos';

/** La fecha del evento se guarda como hora local "envuelta" en UTC (igual que Eventos.tsx). */
function fmtEventoFecha(iso?: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }); }
  catch { return ''; }
}
function audienciaLabel(e: Evento): string {
  switch (e.audiencia) {
    case 'PUBLICO': return 'Público';
    case 'MIEMBROS': return 'Miembros';
    case 'COORDINADORES': return 'Coordinadores';
    case 'GRUPO': return e.grupoNombre || 'Grupo';
    default: return '';
  }
}
function fmtFecha(iso?: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return ''; }
}
function abrir(url?: string) { if (url) window.open(url, '_blank'); }

const SectionTitle: React.FC<{ icon: string; children: React.ReactNode }> = ({ icon, children }) => (
  <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 20 }}>
    <IonIcon icon={icon} color="primary" /> {children}
  </h3>
);

const InicioComuna: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [data, setData] = useState<InicioData | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventosProximos, setEventosProximos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noticia, setNoticia] = useState<InicioNoticia | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Eventos: best-effort, no debe romper el Inicio si falla.
    const eventosProm = getEventos()
      .then((r) => { setEventos(r.eventos); setEventosProximos(r.proximos); })
      .catch(() => { setEventos([]); setEventosProximos(false); });
    try {
      setData(await getInicio());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      await eventosProm;
      setLoading(false);
    }
  }, []);

  useIonViewWillEnter(() => { void cargar(); }, [cargar]);

  const sede = data?.sede;
  const comoLlegar = () => {
    if (!sede) return;
    const q = (sede.lat != null && sede.lng != null)
      ? `${sede.lat},${sede.lng}`
      : encodeURIComponent(sede.direccion);
    abrir(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const referenteNombre = data?.referente
    ? [data.referente.nombres, data.referente.apellidos].filter(Boolean).join(' ')
    : '';

  return (
    <Layout>
      <IonContent className="ion-padding">
        {loading && <div style={{ textAlign: 'center', marginTop: 32 }}><IonSpinner name="crescent" /></div>}
        {error && <IonText color="danger"><p>{error}</p></IonText>}

        {!loading && data && (
          <>
            {/* Encabezado */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              {data.comuna?.branding?.logoUrl && (
                <IonImg src={data.comuna.branding.logoUrl} style={{ maxHeight: 64, margin: '0 auto', objectFit: 'contain' }} />
              )}
              <h2 className="display-font titulo-fluid" style={{ marginBottom: 0 }}>
                Hola{user?.nombre ? `, ${user.nombre}` : ''}
              </h2>
              {data.comuna?.branding?.tagline && (
                <p style={{ marginTop: 2, color: 'var(--ion-color-medium)' }}>{data.comuna.branding.tagline}</p>
              )}
            </div>

            {/* Accesos rápidos */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <IonButton style={{ flex: 1 }} onClick={() => history.push('/comuna/reclamos/nuevo')}>
                <IonIcon icon={addOutline} slot="start" /> Reclamo
              </IonButton>
              <IonButton style={{ flex: 1 }} fill="outline" onClick={() => history.push('/comuna/reclamos')}>
                <IonIcon icon={megaphoneOutline} slot="start" /> Reclamos
              </IonButton>
            </div>
            {data.misReclamosAbiertos > 0 && (
              <IonNote style={{ display: 'block', marginTop: 6, textAlign: 'center' }}>
                Tenés {data.misReclamosAbiertos} reclamo{data.misReclamosAbiertos === 1 ? '' : 's'} abierto{data.misReclamosAbiertos === 1 ? '' : 's'}
              </IonNote>
            )}

            {/* Sede */}
            {sede?.direccion && (
              <>
                <SectionTitle icon={locationOutline}>Sede</SectionTitle>
                <IonCard>
                  <IonCardContent>
                    <p style={{ margin: 0, fontWeight: 600 }}>{sede.direccion}</p>
                    {sede.horarios && (
                      <p style={{ margin: '4px 0', color: 'var(--ion-color-medium)' }}>
                        <IonIcon icon={timeOutline} /> {sede.horarios}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <IonButton size="small" fill="outline" onClick={comoLlegar}>
                        <IonIcon icon={navigateOutline} slot="start" /> Cómo llegar
                      </IonButton>
                      {sede.telefono && (
                        <IonButton size="small" onClick={() => abrir(`tel:${sede.telefono}`)}>
                          <IonIcon icon={callOutline} slot="start" /> Llamar
                        </IonButton>
                      )}
                    </div>
                  </IonCardContent>
                </IonCard>
              </>
            )}

            {/* Referente */}
            {referenteNombre && (
              <>
                <SectionTitle icon={personOutline}>Referente de la comuna</SectionTitle>
                <IonList>
                  <IonItem>
                    <IonLabel>
                      <h3>{referenteNombre}</h3>
                      {data.referente?.email && <IonNote>{data.referente.email}</IonNote>}
                    </IonLabel>
                    <ContactoAcciones telefono={data.referente?.telefono} />
                  </IonItem>
                </IonList>
              </>
            )}

            {/* Próximos eventos (fuente real: /api/app/eventos) */}
            {eventosProximos && eventos.length > 0 && (
              <>
                <SectionTitle icon={calendarOutline}>Próximos eventos</SectionTitle>
                <IonList className="cols-md">
                  {eventos.slice(0, 3).map((e) => (
                    <IonItem key={e._id} button detail={false} onClick={() => history.push('/comuna/eventos')}>
                      <IonLabel className="ion-text-wrap">
                        <h3>{e.nombre}</h3>
                        <IonNote>{fmtEventoFecha(e.fecha)}</IonNote>
                      </IonLabel>
                      {audienciaLabel(e) && <IonBadge slot="end" color="light">{audienciaLabel(e)}</IonBadge>}
                    </IonItem>
                  ))}
                </IonList>
                <IonButton fill="clear" size="small" onClick={() => history.push('/comuna/eventos')}>
                  Ver todos <IonIcon icon={chevronForwardOutline} slot="end" />
                </IonButton>
              </>
            )}

            {/* Noticias */}
            {data.noticias.length > 0 && (
              <>
                <SectionTitle icon={newspaperOutline}>Noticias</SectionTitle>
                <IonList className="cols-md">
                  {data.noticias.map((n, i) => (
                    <IonItem key={i} button detail={false} onClick={() => setNoticia(n)}>
                      {n.image && (
                        <IonImg slot="start" src={n.image} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                      )}
                      <IonLabel className="ion-text-wrap">
                        <h3>{n.title}</h3>
                        {n.date && <IonNote>{fmtFecha(n.date)}</IonNote>}
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} color="medium" />
                    </IonItem>
                  ))}
                </IonList>
              </>
            )}

            {/* Redes / contacto */}
            {(data.redes.instagram || data.redes.twitter || data.redes.mail) && (
              <>
                <SectionTitle icon={mailOutline}>Contacto</SectionTitle>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {data.redes.instagram && (
                    <IonButton fill="outline" size="small" onClick={() => abrir(data.redes.instagram)}>
                      <IonIcon icon={logoInstagram} slot="start" /> Instagram
                    </IonButton>
                  )}
                  {data.redes.twitter && (
                    <IonButton fill="outline" size="small" onClick={() => abrir(data.redes.twitter)}>
                      <IonIcon icon={logoTwitter} slot="start" /> X
                    </IonButton>
                  )}
                  {data.redes.mail && (
                    <IonButton fill="outline" size="small" onClick={() => abrir(`mailto:${data.redes.mail}`)}>
                      <IonIcon icon={mailOutline} slot="start" /> Email
                    </IonButton>
                  )}
                </div>
              </>
            )}

            <div style={{ height: 16 }} />
          </>
        )}

        {/* Detalle de noticia */}
        <IonModal isOpen={!!noticia} onDidDismiss={() => setNoticia(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Noticia</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setNoticia(null)}>
                  <IonIcon slot="icon-only" icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {noticia && (
              <>
                {noticia.image && <IonImg src={noticia.image} style={{ borderRadius: 8, marginBottom: 8 }} />}
                <h2 className="display-font" style={{ marginTop: 0 }}>{noticia.title}</h2>
                {noticia.date && <IonNote>{fmtFecha(noticia.date)}</IonNote>}
                <p style={{ marginTop: 8 }}>{noticia.description}</p>
                {noticia.socialLinks?.map((s, i) => (
                  <IonBadge key={i} color="light" style={{ marginRight: 6, cursor: 'pointer' }} onClick={() => abrir(s.url)}>
                    {s.platform} ↗
                  </IonBadge>
                ))}
              </>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </Layout>
  );
};

export default InicioComuna;
