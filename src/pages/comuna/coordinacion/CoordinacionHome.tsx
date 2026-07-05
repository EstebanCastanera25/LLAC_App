import React, { useEffect, useState } from 'react';
import {
  IonContent, IonList, IonItem, IonLabel, IonNote, IonBadge, IonSpinner, IonIcon, IonText,
} from '@ionic/react';
import { chevronForwardOutline, mapOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../AuthContext';
import {
  getMisCircuitos, getTodosCircuitos,
  type CoordCircuito, type CircuitosResumen,
} from '../../../services/coordinacion';
import CircuitoDetalle from './CircuitoDetalle';

/** Fila de totales para el admin de comuna. */
const Totales: React.FC<{ resumen: CircuitosResumen }> = ({ resumen }) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
    {[
      { n: resumen.totalCircuitos, l: 'Circuitos' },
      { n: resumen.totalCoordinadores, l: 'Coordinadores' },
      { n: resumen.totalMiembros, l: 'Miembros' },
    ].map((t) => (
      <div key={t.l} style={{
        flex: 1, textAlign: 'center', padding: '12px 4px', borderRadius: 10,
        background: 'var(--ion-color-light)',
      }}>
        <div className="display-font" style={{ fontSize: 22, color: 'var(--ion-color-primary)' }}>{t.n}</div>
        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{t.l}</div>
      </div>
    ))}
  </div>
);

const ListaCircuitos: React.FC<{ circuitos: CoordCircuito[] }> = ({ circuitos }) => {
  const history = useHistory();
  return (
    <IonList className="cols-md">
      {circuitos.map((c) => (
        <IonItem
          key={c._id}
          button
          detail={false}
          onClick={() => history.push(`/comuna/coordinacion/circuito/${c._id}`)}
        >
          <IonLabel>
            <h2>Circuito {c.numero}</h2>
            {c.nombre && <IonNote>{c.nombre}</IonNote>}
          </IonLabel>
          <IonBadge slot="end" color="primary">{c.cantMiembros} miembros</IonBadge>
          <IonIcon slot="end" icon={chevronForwardOutline} color="medium" />
        </IonItem>
      ))}
    </IonList>
  );
};

/**
 * Home del modo Coordinación.
 *  - Admin de comuna: todos los circuitos + totales.
 *  - Coordinador con 1 circuito: entra directo al detalle de su circuito.
 *  - Coordinador con varios: lista de sus circuitos.
 */
const CoordinacionHome: React.FC = () => {
  const { esAdminComuna } = useAuth();
  const [resumen, setResumen] = useState<CircuitosResumen | null>(null);
  const [circuitos, setCircuitos] = useState<CoordCircuito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        if (esAdminComuna) {
          const r = await getTodosCircuitos();
          if (vivo) setResumen(r);
        } else {
          const c = await getMisCircuitos();
          if (vivo) setCircuitos(c);
        }
      } catch (e) {
        if (vivo) setError((e as Error).message);
      } finally {
        if (vivo) setLoading(false);
      }
    })();
    return () => { vivo = false; };
  }, [esAdminComuna]);

  // Coordinador con un único circuito → mostrar directamente su circuito.
  if (!loading && !error && !esAdminComuna && circuitos.length === 1) {
    return <CircuitoDetalle circuitoId={circuitos[0]._id} asRoot />;
  }

  return (
    <Layout>
      <IonContent className="ion-padding">
        <h2 className="display-font" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IonIcon icon={mapOutline} /> Coordinación
        </h2>
        <p style={{ color: 'var(--ion-color-medium)', marginTop: 0 }}>
          {esAdminComuna ? 'Circuitos de la comuna.' : 'Tus circuitos asignados.'}
        </p>

        {loading && <div style={{ textAlign: 'center', marginTop: 32 }}><IonSpinner name="crescent" /></div>}
        {error && <IonText color="danger"><p>{error}</p></IonText>}

        {!loading && !error && esAdminComuna && resumen && (
          <>
            <Totales resumen={resumen} />
            {resumen.circuitos.length === 0
              ? <IonText color="medium"><p>La comuna no tiene circuitos.</p></IonText>
              : <ListaCircuitos circuitos={resumen.circuitos} />}
          </>
        )}

        {!loading && !error && !esAdminComuna && (
          circuitos.length === 0
            ? <IonText color="medium"><p>No tenés circuitos asignados.</p></IonText>
            : <ListaCircuitos circuitos={circuitos} />
        )}
      </IonContent>
    </Layout>
  );
};

export default CoordinacionHome;
