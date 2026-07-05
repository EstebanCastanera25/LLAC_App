import React, { useEffect, useState } from 'react';
import { IonContent, IonSpinner, IonText, IonChip, IonLabel } from '@ionic/react';
import { useParams } from 'react-router-dom';
import Layout from '../../../components/Layout';
import CircuitoMap, { type MapaPunto } from './CircuitoMap';
import {
  getCircuito, getMiembrosDeCircuito,
  type CoordCircuito,
} from '../../../services/coordinacion';

/** Mapa del circuito con los miembros (y coordinadores) que tienen coordenadas. */
const MapaCircuito: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [circuito, setCircuito] = useState<CoordCircuito | null>(null);
  const [markers, setMarkers] = useState<MapaPunto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const c = await getCircuito(id);
        if (!vivo) return;
        setCircuito(c);
        if (c?._id) {
          const miembros = await getMiembrosDeCircuito(c._id);
          setMarkers(
            miembros
              .filter((m) => m.coordenadas && Number.isFinite(m.coordenadas.lat) && Number.isFinite(m.coordenadas.lng))
              .map((m) => ({
                lat: m.coordenadas!.lat,
                lng: m.coordenadas!.lng,
                label: [m.apellidos, m.nombres].filter(Boolean).join(', '),
              })),
          );
        }
      } catch (e) {
        if (vivo) setError((e as Error).message);
      } finally {
        if (vivo) setLoading(false);
      }
    })();
    return () => { vivo = false; };
  }, [id]);

  return (
    <Layout backHref={`/comuna/coordinacion/circuito/${id}`}>
      <IonContent className="ion-padding">
        {loading && <div style={{ textAlign: 'center', marginTop: 32 }}><IonSpinner name="crescent" /></div>}
        {error && <IonText color="danger"><p>{error}</p></IonText>}
        {!loading && !error && circuito && (
          <>
            <h2 className="display-font" style={{ marginTop: 0 }}>Circuito {circuito.numero}</h2>
            <CircuitoMap
              comunaNumero={circuito.comunaNumero}
              circuitoNumero={circuito.numero}
              markers={markers}
              height="60vh"
            />
            <IonChip color="primary" style={{ marginTop: 12 }}>
              <IonLabel>{markers.length} miembros ubicados</IonLabel>
            </IonChip>
          </>
        )}
      </IonContent>
    </Layout>
  );
};

export default MapaCircuito;
