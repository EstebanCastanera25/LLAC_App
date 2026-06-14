import React, { useEffect } from 'react';
import { IonContent, IonText, IonIcon } from '@ionic/react';
import { hourglassOutline, closeCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components';
import { useAuth } from '../AuthContext';

/** Pantalla de "pendiente de aprobación" / "rechazado". */
const Pendiente: React.FC = () => {
  const history = useHistory();
  const { user, refreshMe, logout } = useAuth();

  const rechazado = user?.estado === 'rechazado';

  // Si ya fue aprobado en el panel, al reintentar lo mandamos al inicio.
  useEffect(() => {
    if (user?.estado === 'aprobado') history.replace('/inicio');
  }, [user, history]);

  const handleReintentar = async () => {
    await refreshMe();
  };

  return (
    <Layout>
      <IonContent className="ion-padding">
        <div style={{ textAlign: 'center', marginTop: '18%' }}>
          <IonIcon
            icon={rechazado ? closeCircleOutline : hourglassOutline}
            style={{ fontSize: 72, color: rechazado ? 'var(--ion-color-danger)' : 'var(--ion-color-warning)' }}
          />
          <h2 className="display-font" style={{ marginBottom: 8 }}>
            {rechazado ? 'Acceso rechazado' : 'Pendiente de aprobación'}
          </h2>
          <IonText color="medium">
            <p>
              {rechazado
                ? 'Tu solicitud de acceso fue rechazada. Contactá a un administrador.'
                : 'Tu usuario fue registrado y está esperando la aprobación de un administrador.'}
            </p>
          </IonText>

          {!rechazado && (
            <Button expand="block" className="ion-margin-top" onClick={handleReintentar}>
              Ya me aprobaron — reintentar
            </Button>
          )}
          <Button expand="block" fill="outline" className="ion-margin-top" onClick={() => { void logout(); }}>
            Salir
          </Button>
        </div>
      </IonContent>
    </Layout>
  );
};

export default Pendiente;
