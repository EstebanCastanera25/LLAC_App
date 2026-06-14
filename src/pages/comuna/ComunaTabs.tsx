import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import {
  homeOutline, calendarOutline, chatbubblesOutline, newspaperOutline, personOutline,
} from 'ionicons/icons';
import MiPerfil from './MiPerfil';
import Placeholder from '../../components/Placeholder';

/** Modo Comuna: barra de pestañas. Mi Perfil funcional; el resto, "Próximamente". */
const ComunaTabs: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/comuna/inicio" render={() => <Placeholder titulo="Inicio" />} />
      <Route exact path="/comuna/eventos" render={() => <Placeholder titulo="Eventos" />} />
      <Route exact path="/comuna/sugerencias" render={() => <Placeholder titulo="Sugerencias" />} />
      <Route exact path="/comuna/noticias" render={() => <Placeholder titulo="Noticias" />} />
      <Route exact path="/comuna/perfil" component={MiPerfil} />
      <Route exact path="/comuna" render={() => <Redirect to="/comuna/perfil" />} />
    </IonRouterOutlet>

    <IonTabBar slot="bottom">
      <IonTabButton tab="inicio" href="/comuna/inicio">
        <IonIcon icon={homeOutline} />
        <IonLabel>Inicio</IonLabel>
      </IonTabButton>
      <IonTabButton tab="eventos" href="/comuna/eventos">
        <IonIcon icon={calendarOutline} />
        <IonLabel>Eventos</IonLabel>
      </IonTabButton>
      <IonTabButton tab="sugerencias" href="/comuna/sugerencias">
        <IonIcon icon={chatbubblesOutline} />
        <IonLabel>Sugerencias</IonLabel>
      </IonTabButton>
      <IonTabButton tab="noticias" href="/comuna/noticias">
        <IonIcon icon={newspaperOutline} />
        <IonLabel>Noticias</IonLabel>
      </IonTabButton>
      <IonTabButton tab="perfil" href="/comuna/perfil">
        <IonIcon icon={personOutline} />
        <IonLabel>Mi Perfil</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

export default ComunaTabs;
