import React, { useCallback, useState } from 'react';
import {
  IonContent, IonList, IonItem, IonLabel, IonBadge, IonSpinner, IonText,
  IonButton, IonIcon, useIonViewWillEnter, useIonToast, useIonAlert,
} from '@ionic/react';
import { peopleOutline, personAddOutline, checkmarkCircle, hourglassOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getGrupos, solicitarGrupo, type GrupoApp, type PerfilGrupos, type SolicitarError } from '../../services/grupos';

const PERFIL_VACIO: PerfilGrupos = { completo: false, faltan: [] };

/** Grupos publicados de la comuna: ver y solicitar unirse (requiere perfil completo). */
const Grupos: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoApp[]>([]);
  const [perfil, setPerfil] = useState<PerfilGrupos>(PERFIL_VACIO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();
  const history = useHistory();

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getGrupos();
      setGrupos(r.grupos);
      setPerfil(r.perfil);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useIonViewWillEnter(() => { void cargar(); }, [cargar]);

  const avisarPerfilIncompleto = useCallback((faltan: string[]) => {
    const lista = faltan.length ? faltan.join(', ') : 'algunos datos';
    presentAlert({
      header: 'Completá tus datos',
      message: `Antes de sumarte al grupo es necesario completar tu perfil. Te falta cargar: ${lista}.`,
      buttons: [
        { text: 'Ahora no', role: 'cancel' },
        { text: 'Ir a Mi perfil', handler: () => history.push('/comuna/perfil') },
      ],
    });
  }, [presentAlert, history]);

  const sumarse = async (g: GrupoApp) => {
    if (guardando) return;
    // Corte inmediato si el perfil no está completo (mismo criterio que el backend).
    if (!perfil.completo) {
      avisarPerfilIncompleto(perfil.faltan);
      return;
    }
    setGuardando(g.id);
    try {
      const r = await solicitarGrupo(g.id);
      setGrupos((prev) => prev.map((x) => (x.id === g.id ? { ...x, miSolicitud: r.estado } : x)));
      presentToast({ message: 'Solicitud enviada. Un coordinador la revisará.', duration: 2200, color: 'success' });
    } catch (e) {
      const err = e as SolicitarError;
      if (err.faltan) avisarPerfilIncompleto(err.faltan);
      else presentToast({ message: err.message, duration: 2600, color: 'danger' });
    } finally {
      setGuardando(null);
    }
  };

  const renderEstado = (g: GrupoApp) => {
    if (g.yaMiembro || g.miSolicitud === 'aprobado') {
      return (
        <IonBadge slot="end" color="success">
          <IonIcon icon={checkmarkCircle} /> Miembro
        </IonBadge>
      );
    }
    if (g.miSolicitud === 'pendiente') {
      return (
        <IonBadge slot="end" color="warning">
          <IonIcon icon={hourglassOutline} /> Pendiente
        </IonBadge>
      );
    }
    return (
      <IonButton
        slot="end"
        size="small"
        fill="solid"
        color="primary"
        disabled={guardando === g.id}
        onClick={(e) => { e.stopPropagation(); void sumarse(g); }}
      >
        <IonIcon icon={personAddOutline} slot="start" />
        Sumarme
      </IonButton>
    );
  };

  return (
    <Layout>
      <IonContent className="ion-padding">
        <h2 className="display-font titulo-fluid" style={{ margin: 0 }}>
          Grupos <IonBadge color="primary">{grupos.length}</IonBadge>
        </h2>
        <p style={{ marginTop: 6, color: 'var(--ion-color-medium)' }}>
          Sumate a los grupos de la comuna que te interesen.
        </p>

        {!loading && !error && !perfil.completo && (
          <IonText color="warning">
            <p style={{ marginTop: 4, fontSize: 14 }}>
              <IonIcon icon={personAddOutline} /> Para sumarte a un grupo primero completá tu perfil
              {perfil.faltan.length ? ` (falta: ${perfil.faltan.join(', ')})` : ''}.
            </p>
          </IonText>
        )}

        {loading && <div style={{ textAlign: 'center', marginTop: 32 }}><IonSpinner name="crescent" /></div>}
        {error && <IonText color="danger"><p>{error}</p></IonText>}
        {!loading && !error && grupos.length === 0 && (
          <IonText color="medium"><p>Todavía no hay grupos disponibles.</p></IonText>
        )}

        <IonList className="cols-md">
          {grupos.map((g) => (
            <IonItem key={g.id} lines="full">
              <IonIcon icon={peopleOutline} slot="start" color="primary" />
              <IonLabel>
                <h3 style={{ fontWeight: 600 }}>{g.nombre}</h3>
                {g.miSolicitud === 'rechazado' && (
                  <p style={{ color: 'var(--ion-color-medium)' }}>Tu solicitud anterior fue rechazada.</p>
                )}
              </IonLabel>
              {renderEstado(g)}
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </Layout>
  );
};

export default Grupos;
