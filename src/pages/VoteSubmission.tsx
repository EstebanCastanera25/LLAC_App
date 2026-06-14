import { IonContent, IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import { Button } from '../components';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Layout from '../components/Layout';

const VoteSubmission: React.FC = () => {
  const history = useHistory();
  const [candidate, setCandidate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('vote', candidate);
    history.push('/voter');
  };

  return (
    <Layout backHref="/mesas">
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
          <IonItem className="form-field">
            <IonLabel position="stacked" className="text-gray-700 font-semibold">
              Candidato
            </IonLabel>
            <IonSelect
              className="rounded-select"
              value={candidate}
              onIonChange={e => setCandidate(e.detail.value)}
              required
            >
              <IonSelectOption value="A">Candidato A</IonSelectOption>
              <IonSelectOption value="B">Candidato B</IonSelectOption>
            </IonSelect>
          </IonItem>
          <Button expand="block" type="submit" className="ion-margin-top">Enviar voto</Button>
        </form>
      </IonContent>
    </Layout>
  );
};

export default VoteSubmission;
