import React from 'react';
import { IonContent, IonIcon } from '@ionic/react';
import { constructOutline } from 'ionicons/icons';
import Layout from './Layout';

/** Pantalla genérica "Próximamente" para secciones aún no implementadas. */
const Placeholder: React.FC<{ titulo: string }> = ({ titulo }) => (
  <Layout>
    <IonContent className="ion-padding">
      <div style={{ textAlign: 'center', marginTop: '25%' }}>
        <IonIcon icon={constructOutline} style={{ fontSize: 64, color: 'var(--ion-color-medium)' }} />
        <h2 className="display-font" style={{ marginBottom: 4 }}>{titulo}</h2>
        <p style={{ marginTop: 0, color: 'var(--ion-color-medium)' }}>Próximamente</p>
      </div>
    </IonContent>
  </Layout>
);

export default Placeholder;
