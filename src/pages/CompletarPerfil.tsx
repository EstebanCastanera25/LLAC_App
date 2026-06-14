import React, { useEffect, useState } from 'react';
import { IonContent, IonText } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button, Input } from '../components';
import { useAuth } from '../AuthContext';

/** Capitaliza la primera letra de cada palabra (respeta acentos y ñ). */
const capitalizar = (s: string) =>
  s.replace(/(^|\s)(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());

/**
 * Completar perfil tras el registro con Google. Email read-only; nombre, apellido
 * y teléfono editables (precargados desde Google) y obligatorios.
 */
const CompletarPerfil: React.FC = () => {
  const history = useHistory();
  const { user, updateProfile, homeRoute } = useAuth();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setNombre(capitalizar(user.nombre || ''));
      setApellido(capitalizar(user.apellido || ''));
      setTelefono(user.telefono || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombre.trim() || !apellido.trim() || !telefono.trim()) {
      setError('Nombre, apellido y teléfono son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ nombre: nombre.trim(), apellido: apellido.trim(), telefono: telefono.trim() });
      history.replace(homeRoute());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <IonContent className="ion-padding">
        <h2 className="display-font" style={{ marginBottom: 4 }}>Completá tu perfil</h2>
        <IonText color="medium">
          <p style={{ marginTop: 0 }}>Confirmá tus datos para continuar.</p>
        </IonText>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field-label">Email</label>
            <Input value={user?.email || ''} readonly disabled />
          </div>

          <div className="field">
            <label className="field-label">Nombre *</label>
            <Input
              value={nombre}
              autocapitalize="words"
              onIonInput={(e) => setNombre(capitalizar(e.detail.value ?? ''))}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Apellido *</label>
            <Input
              value={apellido}
              autocapitalize="words"
              onIonInput={(e) => setApellido(capitalizar(e.detail.value ?? ''))}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Teléfono *</label>
            <Input
              value={telefono}
              type="tel"
              inputMode="tel"
              placeholder="+54 11 1234-5678"
              onIonInput={(e) => setTelefono(e.detail.value ?? '')}
              required
            />
          </div>

          {error && <p className="text-red-600 ion-margin-top">{error}</p>}

          <Button expand="block" type="submit" className="ion-margin-top" disabled={saving}>
            {saving ? 'Guardando…' : 'Confirmar'}
          </Button>
        </form>
      </IonContent>
    </Layout>
  );
};

export default CompletarPerfil;
