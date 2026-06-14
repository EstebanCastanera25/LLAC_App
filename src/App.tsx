import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonSpinner, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Login from './pages/Login';
import Register from './pages/Register';
import CompletarPerfil from './pages/CompletarPerfil';
import Pendiente from './pages/Pendiente';
import Inicio from './pages/Inicio';
import ComunaTabs from './pages/comuna/ComunaTabs';
import VoterList from './pages/VoterList';
import AddVoter from './pages/AddVoter';
import SelectMesa from './pages/SelectMesa';
import FiscalizacionLookup from './pages/FiscalizacionLookup';
import FiscalizacionActions from './pages/FiscalizacionActions';
import Escrutinio from './pages/Escrutinio';
import { AuthProvider, useAuth } from './AuthContext';
import Protected from './components/Protected';
import FiscalRoute from './FiscalRoute';
import { FiscalDataProvider } from './FiscalDataContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

/** Redirección raíz según el estado del usuario. */
const RootRedirect: React.FC = () => {
  const { loading, homeRoute } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <IonSpinner name="crescent" />
      </div>
    );
  }
  return <Redirect to={homeRoute()} />;
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <AuthProvider>
        <FiscalDataProvider>
          <IonRouterOutlet>
            <Route exact path="/login" component={Login} />
            <Route exact path="/register" component={Register} />

            <Protected exact path="/completar-perfil" level="auth" component={CompletarPerfil} />
            <Protected exact path="/pendiente" level="auth" component={Pendiente} />

            <Protected exact path="/inicio" level="approved" component={Inicio} />
            <Protected path="/comuna" level="approved" component={ComunaTabs} />

            {/* Flujo de fiscalización */}
            <Protected exact path="/fiscalizacion-lookup" level="fiscal" component={FiscalizacionLookup} />
            <FiscalRoute exact path="/fiscalizacion-acciones" component={FiscalizacionActions} />
            <FiscalRoute exact path="/escrutinio" component={Escrutinio} />

            {/* Padrón offline (legacy) */}
            <Protected exact path="/select-mesa" level="fiscal" component={SelectMesa} />
            <FiscalRoute exact path="/voters" component={VoterList} />
            <Protected exact path="/add-voter" level="fiscal" component={AddVoter} />

            <Route exact path="/" component={RootRedirect} />
          </IonRouterOutlet>
        </FiscalDataProvider>
      </AuthProvider>
    </IonReactRouter>
  </IonApp>
);

export default App;
