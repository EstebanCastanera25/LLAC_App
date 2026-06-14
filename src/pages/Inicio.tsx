import React, { useEffect } from 'react';
import { IonContent, IonIcon } from '@ionic/react';
import { personCircleOutline, documentTextOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components';
import { useAuth } from '../AuthContext';

/**
 * Selector de modo. Comuna siempre disponible; Fiscalización solo si está
 * habilitada por config (fiscalizacionEnabled) y el usuario tiene perfil 'fiscal'.
 * Si hay una sola opción, se entra directo a Comuna (sin mostrar el selector).
 */
const Inicio: React.FC = () => {
  const history = useHistory();
  const { user, esFiscal, fiscalizacionEnabled } = useAuth();
  const mostrarFiscalizacion = fiscalizacionEnabled && esFiscal;

  useEffect(() => {
    if (!mostrarFiscalizacion) history.replace('/comuna');
  }, [mostrarFiscalizacion, history]);

  if (!mostrarFiscalizacion) return null;

  return (
    <Layout>
      <IonContent className="ion-padding">
        <div style={{ marginTop: '8%' }}>
          <h2 className="display-font" style={{ marginBottom: 4 }}>
            Hola{user?.nombre ? `, ${user.nombre}` : ''}
          </h2>
          <p style={{ marginTop: 0, color: 'var(--ion-color-medium)' }}>¿Qué querés hacer?</p>

          <Button expand="block" className="ion-margin-top" onClick={() => history.push('/comuna')}>
            <IonIcon icon={personCircleOutline} slot="start" />
            Comuna
          </Button>

          {mostrarFiscalizacion && (
            <Button
              expand="block"
              color="secondary"
              className="ion-margin-top"
              onClick={() => history.push('/fiscalizacion-lookup')}
            >
              <IonIcon icon={documentTextOutline} slot="start" />
              Fiscalización
            </Button>
          )}
        </div>
      </IonContent>
    </Layout>
  );
};

export default Inicio;
