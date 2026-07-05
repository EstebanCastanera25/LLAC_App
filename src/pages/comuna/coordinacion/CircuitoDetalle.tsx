import React, { useEffect, useState } from 'react';
import {
  IonContent, IonList, IonItem, IonLabel, IonNote, IonSpinner, IonIcon, IonText,
  IonButton, IonListHeader,
} from '@ionic/react';
import { mapOutline, personOutline, peopleOutline } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import Layout from '../../../components/Layout';
import ContactoAcciones from '../../../components/ContactoAcciones';
import {
  getCircuito, getMiembrosDeCircuito,
  type CoordCircuito, type CircuitoMiembro,
} from '../../../services/coordinacion';

interface Props {
  /** Si viene, se usa este id en vez del de la URL (modo "circuito único" del coordinador). */
  circuitoId?: string;
  /** Cuando es la raíz de la pestaña, no se muestra el botón "Volver". */
  asRoot?: boolean;
}

/** Detalle de un circuito: coordinadores, miembros y accesos a mapa/reclamos. */
const CircuitoDetalle: React.FC<Props> = ({ circuitoId: propId, asRoot }) => {
  const params = useParams<{ id: string }>();
  const id = propId ?? params.id;
  const history = useHistory();

  const [circuito, setCircuito] = useState<CoordCircuito | null>(null);
  const [miembros, setMiembros] = useState<CircuitoMiembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backHref = asRoot ? undefined : '/comuna/coordinacion';

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const c = await getCircuito(id);
        if (!vivo) return;
        setCircuito(c);
        setMiembros(await getMiembrosDeCircuito(id));
      } catch (e) {
        if (vivo) setError((e as Error).message);
      } finally {
        if (vivo) setLoading(false);
      }
    })();
    return () => { vivo = false; };
  }, [id]);

  if (loading) {
    return (
      <Layout backHref={backHref}>
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', marginTop: 32 }}><IonSpinner name="crescent" /></div>
        </IonContent>
      </Layout>
    );
  }

  if (error || !circuito) {
    return (
      <Layout backHref={backHref}>
        <IonContent className="ion-padding">
          <IonText color="danger"><p>{error || 'Circuito no encontrado.'}</p></IonText>
        </IonContent>
      </Layout>
    );
  }

  const propio = circuito.coordinadores.find((co) => co.esVos);
  const otrosCoordinadores = circuito.coordinadores.filter((co) => !co.esVos);

  return (
    <Layout backHref={backHref}>
      <IonContent className="ion-padding">
        <h2 className="display-font">Circuito {circuito.numero}</h2>
        {circuito.nombre && <p style={{ marginTop: 0, color: 'var(--ion-color-medium)' }}>{circuito.nombre}</p>}

        <div style={{ margin: '12px 0' }}>
          <IonButton expand="block" fill="outline"
            onClick={() => history.push(`/comuna/coordinacion/circuito/${circuito._id}/mapa`)}>
            <IonIcon icon={mapOutline} slot="start" /> Mapa del circuito
          </IonButton>
        </div>

        <IonList>
          <IonListHeader>
            <IonLabel><IonIcon icon={peopleOutline} /> Coordinadores</IonLabel>
          </IonListHeader>
          {propio && (
            <IonItem>
              <IonLabel>
                <h3>Vos</h3>
                <IonNote>{propio.email}</IonNote>
              </IonLabel>
            </IonItem>
          )}
          {otrosCoordinadores.length === 0 && !propio && (
            <IonItem lines="none"><IonLabel color="medium">Sin coordinadores</IonLabel></IonItem>
          )}
          {otrosCoordinadores.map((co, i) => (
            <IonItem key={i}>
              <IonIcon icon={personOutline} slot="start" color="medium" />
              <IonLabel>
                <h3>{[co.nombres, co.apellidos].filter(Boolean).join(' ')}</h3>
                <IonNote>{[co.telefono, co.email].filter(Boolean).join(' · ')}</IonNote>
              </IonLabel>
              <ContactoAcciones telefono={co.telefono} />
            </IonItem>
          ))}
        </IonList>

        <IonList>
          <IonListHeader>
            <IonLabel><IonIcon icon={peopleOutline} /> Miembros ({miembros.length})</IonLabel>
          </IonListHeader>
          {miembros.length === 0 && (
            <IonItem lines="none"><IonLabel color="medium">Sin miembros asignados</IonLabel></IonItem>
          )}
          {miembros.map((m) => (
            <IonItem key={m._id}>
              <IonLabel>
                <h3>{[m.apellidos, m.nombres].filter(Boolean).join(', ')}</h3>
                <IonNote>{[m.barrio, m.telefono].filter(Boolean).join(' · ')}</IonNote>
              </IonLabel>
              <ContactoAcciones telefono={m.telefono} />
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </Layout>
  );
};

export default CircuitoDetalle;
