import React, { useCallback, useState } from 'react';
import {
  IonContent, IonList, IonItem, IonLabel, IonNote, IonBadge, IonSpinner, IonText,
  IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonCard, IonCardContent, useIonViewWillEnter, useIonToast,
} from '@ionic/react';
import { closeOutline, calendarOutline, openOutline, peopleOutline, personAddOutline, checkmarkCircle } from 'ionicons/icons';
import Layout from '../../components/Layout';
import { getEventos, anotarse, desanotarse, type Evento } from '../../services/eventos';

function fmtFecha(iso: string): string {
  if (!iso) return '';
  // La fecha del evento se guarda como hora local "envuelta" en UTC (mismo criterio que el panel),
  // por eso se formatea en UTC para mostrar la hora tal cual se cargó.
  try { return new Date(iso).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }); }
  catch { return ''; }
}

function audienciaLabel(e: Evento): string {
  switch (e.audiencia) {
    case 'PUBLICO': return 'Público';
    case 'MIEMBROS': return 'Miembros';
    case 'COORDINADORES': return 'Coordinadores';
    case 'GRUPO': return e.grupoNombre || 'Grupo';
    default: return e.audiencia;
  }
}

function audienciaColor(e: Evento): string {
  switch (e.audiencia) {
    case 'PUBLICO': return 'success';
    case 'MIEMBROS': return 'primary';
    case 'COORDINADORES': return 'warning';
    case 'GRUPO': return 'tertiary';
    default: return 'medium';
  }
}

function tipoLabel(tipo: string): string {
  if (!tipo) return '';
  return tipo.charAt(0) + tipo.slice(1).toLowerCase();
}

/** Eventos de la comuna visibles para el usuario (públicos + sus grupos/rol). */
const Eventos: React.FC = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [proximos, setProximos] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Evento | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [presentToast] = useIonToast();

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getEventos();
      setEventos(r.eventos);
      setProximos(r.proximos);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useIonViewWillEnter(() => { void cargar(); }, [cargar]);

  const aplicarAnotado = (id: string, anotado: boolean) => {
    setEventos((prev) => prev.map((e) => (e._id === id ? { ...e, anotado } : e)));
    setDetalle((d) => (d && d._id === id ? { ...d, anotado } : d));
  };

  const toggleAnotado = async (ev: Evento) => {
    if (guardando) return;
    setGuardando(ev._id);
    try {
      if (ev.anotado) {
        await desanotarse(ev._id);
        aplicarAnotado(ev._id, false);
        presentToast({ message: 'Te desanotaste del evento', duration: 1800, color: 'medium' });
      } else {
        await anotarse(ev._id);
        aplicarAnotado(ev._id, true);
        presentToast({ message: '¡Anotado al evento!', duration: 1800, color: 'success' });
      }
    } catch (e) {
      presentToast({ message: (e as Error).message, duration: 2600, color: 'danger' });
    } finally {
      setGuardando(null);
    }
  };

  const renderAnotarBtn = (ev: Evento, expand = false) => {
    if (!proximos) return null;
    const bloqueadoDesanotar = ev.anotado && !ev.puedeDesanotar;
    return (
      <div style={{ marginTop: expand ? 16 : 10 }}>
        <IonButton
          size={expand ? undefined : 'small'}
          expand={expand ? 'block' : undefined}
          fill={ev.anotado ? 'outline' : 'solid'}
          color={ev.anotado ? 'success' : 'primary'}
          disabled={guardando === ev._id || bloqueadoDesanotar}
          onClick={(e) => { e.stopPropagation(); void toggleAnotado(ev); }}
        >
          <IonIcon icon={ev.anotado ? checkmarkCircle : personAddOutline} slot="start" />
          {ev.anotado ? 'Anotado' : 'Anotarse'}
        </IonButton>
        {bloqueadoDesanotar && (
          <IonNote color="medium" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
            No se puede cancelar (faltan menos de 5 h).
          </IonNote>
        )}
      </div>
    );
  };

  const principal = eventos[0];
  const resto = eventos.slice(1);

  return (
    <Layout>
      <IonContent className="ion-padding">
        <h2 className="display-font titulo-fluid" style={{ margin: 0 }}>
          Eventos <IonBadge color="primary">{eventos.length}</IonBadge>
        </h2>

        {loading && <div style={{ textAlign: 'center', marginTop: 32 }}><IonSpinner name="crescent" /></div>}
        {error && <IonText color="danger"><p>{error}</p></IonText>}
        {!loading && !error && eventos.length === 0 && (
          <IonText color="medium"><p>Todavía no hay eventos para vos.</p></IonText>
        )}
        {!loading && !error && eventos.length > 0 && !proximos && (
          <IonNote color="medium" style={{ display: 'block', marginTop: 8 }}>
            No hay eventos próximos — mostrando los más recientes.
          </IonNote>
        )}

        {/* Evento principal (destacado) */}
        {!loading && principal && (
          <IonCard button onClick={() => setDetalle(principal)} style={{ marginTop: 14 }}>
            <IonCardContent>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <IonBadge color="medium">{tipoLabel(principal.tipo)}</IonBadge>
                <IonBadge color={audienciaColor(principal)}>{audienciaLabel(principal)}</IonBadge>
              </div>
              <h2 className="display-font" style={{ margin: '0 0 6px' }}>{principal.nombre}</h2>
              <p style={{ margin: '0 0 8px', color: 'var(--ion-color-medium)' }}>
                <IonIcon icon={calendarOutline} /> {fmtFecha(principal.fecha)}
              </p>
              {principal.descripcion && <p style={{ margin: 0 }}>{principal.descripcion}</p>}
              {renderAnotarBtn(principal)}
              {principal.linkInscripcion && (
                <IonButton
                  size="small"
                  fill="clear"
                  style={{ marginTop: 4 }}
                  href={principal.linkInscripcion}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IonIcon icon={openOutline} slot="start" /> Inscribirme (link)
                </IonButton>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Resto de eventos */}
        <IonList className="cols-md">
          {resto.map((ev) => (
            <IonItem key={ev._id} button detail={false} onClick={() => setDetalle(ev)}>
              <IonLabel>
                <h3 style={{ fontWeight: 600 }}>{ev.nombre}</h3>
                <p><IonIcon icon={calendarOutline} /> {fmtFecha(ev.fecha)}</p>
              </IonLabel>
              <IonBadge slot="end" color={audienciaColor(ev)}>{audienciaLabel(ev)}</IonBadge>
            </IonItem>
          ))}
        </IonList>

        {/* Detalle del evento */}
        <IonModal isOpen={!!detalle} onDidDismiss={() => setDetalle(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{detalle?.nombre}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setDetalle(null)}>
                  <IonIcon slot="icon-only" icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {detalle && (
              <>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <IonBadge color="medium">{tipoLabel(detalle.tipo)}</IonBadge>
                  <IonBadge color={audienciaColor(detalle)}>
                    <IonIcon icon={peopleOutline} /> {audienciaLabel(detalle)}
                  </IonBadge>
                </div>
                <p style={{ margin: '0 0 12px', color: 'var(--ion-color-medium)' }}>
                  <IonIcon icon={calendarOutline} /> {fmtFecha(detalle.fecha)}
                </p>
                <h3 style={{ marginBottom: 4 }}>Descripción</h3>
                <p style={{ marginTop: 0 }}>{detalle.descripcion || '—'}</p>
                {renderAnotarBtn(detalle, true)}
                {detalle.linkInscripcion && (
                  <IonButton
                    expand="block"
                    fill="clear"
                    style={{ marginTop: 8 }}
                    href={detalle.linkInscripcion}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IonIcon icon={openOutline} slot="start" /> Inscribirme (link)
                  </IonButton>
                )}
              </>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </Layout>
  );
};

export default Eventos;
