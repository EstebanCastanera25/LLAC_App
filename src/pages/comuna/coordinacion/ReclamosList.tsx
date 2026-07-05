import React, { useCallback, useState } from 'react';
import {
  IonContent, IonList, IonItem, IonLabel, IonNote, IonBadge, IonSpinner, IonText,
  IonButton, IonIcon, IonSearchbar, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonImg, useIonViewWillEnter,
} from '@ionic/react';
import { addOutline, locationOutline, closeOutline, personOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Layout from '../../../components/Layout';
import { getReclamos, type Reclamo } from '../../../services/coordinacion';

const COLOR_ESTADO: Record<Reclamo['estado'], string> = {
  abierto: 'warning',
  en_curso: 'primary',
  enviado: 'tertiary',
  resuelto: 'success',
};
const LABEL_ESTADO: Record<Reclamo['estado'], string> = {
  abierto: 'Abierto',
  en_curso: 'En curso',
  enviado: 'Enviado',
  resuelto: 'Resuelto',
};

function fmtFecha(iso: string): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return ''; }
}

/** Listado de reclamos, con scope según rol (miembro=propios, coord=circuito, admin=comuna). */
const ReclamosList: React.FC = () => {
  const history = useHistory();
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [esAdmin, setEsAdmin] = useState(false);
  const [esCoordinador, setEsCoordinador] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [detalle, setDetalle] = useState<Reclamo | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getReclamos();
      setReclamos(r.reclamos);
      setEsAdmin(r.esAdmin);
      setEsCoordinador(r.esCoordinador);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Se recarga cada vez que se entra a la vista (incluye volver tras crear uno).
  useIonViewWillEnter(() => { void cargar(); }, [cargar]);

  const ajeno = esAdmin || esCoordinador; // muestra "quién reportó"
  const titulo = esAdmin ? 'Reclamos de la comuna' : esCoordinador ? 'Reclamos de mis circuitos' : 'Mis reclamos';

  const q = query.trim().toLowerCase();
  const filtrados = q
    ? reclamos.filter((r) =>
      [r.codigo, r.descripcion, r.ubicacion?.direccion, r.creadoPor?.nombre]
        .some((s) => (s || '').toLowerCase().includes(q)))
    : reclamos;

  return (
    <Layout>
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="display-font titulo-fluid" style={{ margin: 0 }}>
            {titulo} <IonBadge color="primary">{reclamos.length}</IonBadge>
          </h2>
          <IonButton size="small" onClick={() => history.push('/comuna/reclamos/nuevo')}>
            <IonIcon icon={addOutline} slot="start" /> Nuevo
          </IonButton>
        </div>

        <IonSearchbar
          value={query}
          onIonInput={(e) => setQuery(e.detail.value ?? '')}
          placeholder="Buscar por código, descripción o dirección"
          debounce={150}
        />

        {loading && <div style={{ textAlign: 'center', marginTop: 32 }}><IonSpinner name="crescent" /></div>}
        {error && <IonText color="danger"><p>{error}</p></IonText>}
        {!loading && !error && reclamos.length === 0 && (
          <IonText color="medium"><p>Todavía no hay reclamos.</p></IonText>
        )}
        {!loading && !error && reclamos.length > 0 && filtrados.length === 0 && (
          <IonText color="medium"><p>Sin resultados para “{query}”.</p></IonText>
        )}

        <IonList className="cols-md">
          {filtrados.map((r) => (
            <IonItem key={r._id} button detail={false} onClick={() => setDetalle(r)}>
              <IonLabel>
                <h3 style={{ fontWeight: 600 }}>{r.codigo}</h3>
                <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.descripcion || r.ubicacion?.direccion || '—'}
                </p>
                {ajeno && r.creadoPor?.nombre && (
                  <IonNote><IonIcon icon={personOutline} /> {r.creadoPor.nombre}</IonNote>
                )}
              </IonLabel>
              <IonBadge slot="end" color={COLOR_ESTADO[r.estado]}>{LABEL_ESTADO[r.estado]}</IonBadge>
            </IonItem>
          ))}
        </IonList>

        {/* Detalle completo del reclamo (incluye la foto). */}
        <IonModal isOpen={!!detalle} onDidDismiss={() => setDetalle(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{detalle?.codigo}</IonTitle>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <IonBadge color={COLOR_ESTADO[detalle.estado]}>{LABEL_ESTADO[detalle.estado]}</IonBadge>
                  <IonNote>{fmtFecha(detalle.createdAt)}</IonNote>
                </div>
                {detalle.fotos?.[0] && (
                  <IonImg src={detalle.fotos[0]} style={{ borderRadius: 8, maxHeight: 260, objectFit: 'cover' }} />
                )}
                <h3 style={{ marginBottom: 4 }}>Descripción</h3>
                <p style={{ marginTop: 0 }}>{detalle.descripcion || '—'}</p>

                <h3 style={{ marginBottom: 4 }}>Ubicación</h3>
                <p style={{ marginTop: 0 }}>
                  <IonIcon icon={locationOutline} /> {detalle.ubicacion?.direccion || '—'}
                </p>
                {detalle.ubicacion && (
                  <IonNote>{detalle.ubicacion.lat.toFixed(5)}, {detalle.ubicacion.lng.toFixed(5)}</IonNote>
                )}
                <p style={{ marginTop: 12, color: 'var(--ion-color-medium)' }}>
                  Circuito {detalle.circuitoNumero}
                  {ajeno && detalle.creadoPor?.nombre ? ` · Reportó: ${detalle.creadoPor.nombre}` : ''}
                </p>
              </>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </Layout>
  );
};

export default ReclamosList;
