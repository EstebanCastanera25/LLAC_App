import React, { useRef, useState } from 'react';
import { IonContent, IonItem, IonLabel, useIonViewWillEnter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button, Input } from '../components';
import { normalizeFiscalData, useFiscalData } from '../FiscalDataContext';
import type { FiscalData } from '../FiscalDataContext';
import { postJson, getTenantHeaders } from '../utils/api';

const BUSCAR_FISCAL_PATH = '/api/app/fiscalizacion/buscarFiscal';

// Extrae el objeto real del fiscal de la respuesta.
function extractFiscalData(payload: unknown): unknown {
  type PayloadType = { payload?: { data?: unknown }; data?: unknown };
  const p = payload as PayloadType;
  return p?.payload?.data ?? p?.data ?? payload;
}

const FiscalizacionLookup: React.FC = () => {
  const [dni, setDni] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const history = useHistory();
  const { setFiscalData } = useFiscalData();

  useIonViewWillEnter(() => {
    setDni('');
    setError(null);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const el = document.getElementById('dni-input') as HTMLInputElement | null;
    const dniValue = (el?.value ?? dni ?? '').toString().trim();
    if (!dniValue) { setError('DNI inválido'); return; }
    const dniNum = Number(dniValue);
    if (Number.isNaN(dniNum)) { setError('DNI inválido'); return; }

    setBusy(true);
    try {
      const r = await postJson(BUSCAR_FISCAL_PATH, { dni_miembro: dniNum }, getTenantHeaders());

      if (r.status === 401) { history.replace('/login'); return; }
      if (!r.ok) {
        const msg = typeof r.payload === 'string'
          ? r.payload
          : (r.payload as { mensaje?: string })?.mensaje || 'DNI no registrado';
        throw new Error(msg);
      }

      const fiscalRaw = extractFiscalData(r.payload);
      const normalizedFiscal = normalizeFiscalData(fiscalRaw) ?? (fiscalRaw as FiscalData);
      localStorage.setItem('fiscalData', JSON.stringify(normalizedFiscal));
      setFiscalData(normalizedFiscal);
      history.push('/fiscalizacion-acciones', { fiscalData: normalizedFiscal });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'DNI no registrado');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout backHref="/inicio">
      <IonContent className="ion-padding">
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <IonItem className="form-field" lines="none">
            <IonLabel position="stacked" className="font-semibold mt-2">DNI del miembro</IonLabel>
            <div style={{ height: 8 }} />
            <Input
              className="mt-2"
              id="dni-input"
              value={dni}
              inputMode="numeric"
              enterKeyHint="done"
              onIonChange={(e) => setDni(e.detail.value!)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
              required
            />
          </IonItem>

          <Button expand="block" type="submit" className="ion-margin-top" disabled={busy}>
            {busy ? 'Buscando…' : 'Buscar'}
          </Button>
        </form>

        {error && <p className="text-red-600 ion-margin-top">{error}</p>}
      </IonContent>
    </Layout>
  );
};

export default FiscalizacionLookup;
