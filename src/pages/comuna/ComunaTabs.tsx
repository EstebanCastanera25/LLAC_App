import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import {
  homeOutline, calendarOutline, peopleOutline, mapOutline, megaphoneOutline,
} from 'ionicons/icons';
import MiPerfil from './MiPerfil';
import InicioComuna from './InicioComuna';
import Eventos from './Eventos';
import Grupos from './Grupos';
import CoordinacionHome from './coordinacion/CoordinacionHome';
import CircuitoDetalle from './coordinacion/CircuitoDetalle';
import MapaCircuito from './coordinacion/MapaCircuito';
import ReclamosList from './coordinacion/ReclamosList';
import NuevoReclamo from './coordinacion/NuevoReclamo';
import { useAuth } from '../../AuthContext';

/**
 * Modo Comuna: barra de pestañas.
 *  - Reclamos: disponible para todos los usuarios aprobados (miembros incluidos).
 *  - Comuna (coordinación): solo coordinadores de circuito o admin de comuna.
 */
const ComunaTabs: React.FC = () => {
  const { esCoordinador, esAdminComuna } = useAuth();
  const puedeCoordinacion = esCoordinador || esAdminComuna;

  // Guard de las rutas de coordinación (circuitos/mapa): si no tiene acceso → Mi Perfil.
  const soloCoord = (Component: React.ComponentType) => () =>
    (puedeCoordinacion ? <Component /> : <Redirect to="/comuna/perfil" />);

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/comuna/inicio" component={InicioComuna} />
        <Route exact path="/comuna/eventos" component={Eventos} />
        <Route exact path="/comuna/grupos" component={Grupos} />
        <Route exact path="/comuna/perfil" component={MiPerfil} />

        {/* Reclamos: cualquier usuario aprobado */}
        <Route exact path="/comuna/reclamos" component={ReclamosList} />
        <Route exact path="/comuna/reclamos/nuevo" component={NuevoReclamo} />

        {/* Coordinación: coordinador o admin de comuna */}
        <Route exact path="/comuna/coordinacion" render={soloCoord(CoordinacionHome)} />
        <Route exact path="/comuna/coordinacion/circuito/:id" render={soloCoord(CircuitoDetalle)} />
        <Route exact path="/comuna/coordinacion/circuito/:id/mapa" render={soloCoord(MapaCircuito)} />

        <Route exact path="/comuna" render={() => <Redirect to="/comuna/inicio" />} />
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
        <IonTabButton tab="grupos" href="/comuna/grupos">
          <IonIcon icon={peopleOutline} />
          <IonLabel>Grupos</IonLabel>
        </IonTabButton>
        <IonTabButton tab="reclamos" href="/comuna/reclamos">
          <IonIcon icon={megaphoneOutline} />
          <IonLabel>Reclamos</IonLabel>
        </IonTabButton>
        {puedeCoordinacion && (
          <IonTabButton tab="coordinacion" href="/comuna/coordinacion">
            <IonIcon icon={mapOutline} />
            <IonLabel>Comuna</IonLabel>
          </IonTabButton>
        )}
      </IonTabBar>
    </IonTabs>
  );
};

export default ComunaTabs;
