import {
  IonContent,
  IonItem,
  IonLabel,
} from '@ionic/react';
import { Button, Input } from '../components';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Layout from '../components/Layout';
import { voterDB } from '../voterDB';

const SelectMesa: React.FC = () => {
  const history = useHistory();
  const [seccion, setSeccion] = useState('');
  const [circuito, setCircuito] = useState('');
  const [mesa, setMesa] = useState('');
  const [editing, setEditing] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedSeccion = localStorage.getItem('seccion');
    const savedCircuito = localStorage.getItem('circuito');
    const savedMesa = localStorage.getItem('mesa');
    if (savedSeccion && savedCircuito && savedMesa) {
      setSeccion(savedSeccion);
      setCircuito(savedCircuito);
      setMesa(savedMesa);
      setEditing(false);
    }
  }, []);

  const handleNext = async () => {
    localStorage.setItem('seccion', seccion);
    localStorage.setItem('circuito', circuito);
    localStorage.setItem('mesa', mesa);
    localStorage.setItem('mesaId', mesa); 
    setEditing(false);
    setLoading(true);
    try {
      // Padrón offline (Dexie). La carga remota Firestore fue retirada.
      await voterDB.voters.clear();
      history.push('/voters');
    } catch (error) {
      alert('Error al preparar el padrón');
      console.error('Error preparing voters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModify = () => {
    setEditing(true);
  };

  return (
    <Layout backHref="/login">
      <IonContent className="ion-padding">
        <IonItem className="form-field">
          <IonLabel position="stacked" className="text-gray-700 font-semibold">
            Sección
          </IonLabel>
          <Input
            value={seccion}
            inputmode="numeric"
            maxLength={3}
            disabled={!editing}
            onIonChange={(e) => setSeccion(e.detail.value ?? '')}
          />
        </IonItem>
        <IonItem className="form-field">
          <IonLabel position="stacked" className="text-gray-700 font-semibold">
            Circuito
          </IonLabel>
          <Input
            value={circuito}
            inputmode="numeric"
            maxLength={3}
            disabled={!editing}
            onIonChange={(e) => setCircuito(e.detail.value ?? '')}
          />
        </IonItem>
        <IonItem className="form-field">
          <IonLabel position="stacked" className="text-gray-700 font-semibold">
            Mesa
          </IonLabel>
          <Input
            value={mesa}
            inputmode="numeric"
            maxLength={4}
            disabled={!editing}
            onIonChange={(e) => setMesa(e.detail.value ?? '')}
          />
        </IonItem>

        {!editing && (
          <Button expand="block" onClick={handleModify}>
            Modificar
          </Button>
        )}
        <Button
          expand="block"
          onClick={handleNext}
          disabled={
            loading ||
            !(
              seccion.length === 3 &&
              circuito.length === 3 &&
              mesa.length === 4
            )
          }
        >
          {loading ? 'Cargando...' : 'Siguiente'}
        </Button>
        <Button
          expand="block"
          onClick={() => history.push('/fiscalizacion-lookup')}
        >
          Fiscalización Lookup
        </Button>
      </IonContent>
    </Layout>
  );
};

export default SelectMesa;
