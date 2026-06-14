import React, { useEffect, useState } from 'react';
import {
  IonContent, IonAvatar, IonIcon, IonSelect, IonSelectOption, IonToast,
} from '@ionic/react';
import { personCircleOutline, checkmarkCircle, alertCircle } from 'ionicons/icons';
import Layout from '../../components/Layout';
import { Button, Input } from '../../components';
import Autocomplete from '../../components/Autocomplete';
import PhoneInput from '../../components/PhoneInput';
import { useAuth } from '../../AuthContext';
import type { ProfileInput } from '../../AuthContext';
import { PROVINCIAS, GENEROS, CABA, BARRIOS_CABA } from './comuna.constants';

const capitalizar = (s: string) =>
  s.replace(/(^|\s)(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());

/** Deja solo letras (incl. acentos y ñ) y espacios — sin números ni símbolos. */
const soloLetras = (s: string) => s.replace(/[^\p{L}\s]/gu, '');

const VACIO: ProfileInput = {
  nombre: '', apellido: '', telefono: '', dni: '', fechaNacimiento: '', genero: '',
  ocupacion: '', profesion: '', domicilio: '', provincia: '', localidad: '', barrio: '',
};

/** Modo Comuna → Mi Perfil (editable). */
const MiPerfil: React.FC = () => {
  const { user, updateProfile, refreshMe } = useAuth();
  const [form, setForm] = useState<ProfileInput>(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void refreshMe(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      setForm({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        telefono: user.telefono || '',
        dni: user.dni || '',
        fechaNacimiento: user.fechaNacimiento || '',
        genero: user.genero || '',
        ocupacion: user.ocupacion || '',
        profesion: user.profesion || '',
        domicilio: user.domicilio || '',
        provincia: user.provincia || '',
        localidad: user.localidad || '',
        barrio: user.barrio || '',
      });
    }
  }, [user]);

  const set = (k: keyof ProfileInput, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Al cambiar de provincia se resetean localidad y barrio (dependen de ella).
  const setProvincia = (v: string) => setForm((f) => ({ ...f, provincia: v, localidad: '', barrio: '' }));

  const esCaba = form.provincia === CABA;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setOk(false);
    if (!form.nombre.trim() || !form.apellido.trim() || !form.telefono.trim()) {
      setError('Nombre, apellido y teléfono son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ ...form, nombre: form.nombre.trim(), apellido: form.apellido.trim() });
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout
      footer={
        <div className="ion-padding" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <Button expand="block" onClick={() => handleSubmit()} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      }
    >
      <IonContent className="ion-padding">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          {user?.fotoUrl ? (
            <IonAvatar style={{ width: 76, height: 76, margin: '0 auto' }}>
              <img src={user.fotoUrl} alt="Perfil" />
            </IonAvatar>
          ) : (
            <IonIcon icon={personCircleOutline} style={{ fontSize: 76, color: 'var(--ion-color-primary)' }} />
          )}
          <h2 className="display-font" style={{ marginBottom: 0 }}>Mi perfil</h2>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field-label">Email</label>
            <Input value={user?.email || ''} readonly disabled />
          </div>

          <div className="field">
            <label className="field-label">Nombre *</label>
            <Input value={form.nombre} autocapitalize="words"
              onIonInput={(e) => {
                const v = capitalizar(soloLetras(e.detail.value ?? ''));
                (e.target as HTMLIonInputElement).value = v;
                set('nombre', v);
              }} required />
          </div>

          <div className="field">
            <label className="field-label">Apellido *</label>
            <Input value={form.apellido} autocapitalize="words"
              onIonInput={(e) => {
                const v = capitalizar(soloLetras(e.detail.value ?? ''));
                (e.target as HTMLIonInputElement).value = v;
                set('apellido', v);
              }} required />
          </div>

          <div className="field">
            <label className="field-label">Teléfono *</label>
            <PhoneInput value={form.telefono} onChange={(v) => set('telefono', v)} />
          </div>

          <div className="field">
            <label className="field-label">DNI</label>
            <Input value={form.dni} inputMode="numeric" placeholder="Sin puntos" maxLength={8}
              onIonInput={(e) => set('dni', (e.detail.value ?? '').replace(/\D/g, ''))} />
          </div>

          <div className="field">
            <label className="field-label">Fecha de nacimiento</label>
            <Input value={form.fechaNacimiento} type="date"
              onIonInput={(e) => set('fechaNacimiento', e.detail.value ?? '')} />
          </div>

          <div className="field">
            <label className="field-label">Género</label>
            <IonSelect className="rounded-select" value={form.genero} placeholder="Seleccionar"
              onIonChange={(e) => set('genero', e.detail.value ?? '')}>
              {GENEROS.map((g) => <IonSelectOption key={g} value={g}>{g}</IonSelectOption>)}
            </IonSelect>
          </div>

          <div className="field">
            <label className="field-label">Domicilio</label>
            <Input value={form.domicilio} placeholder="Calle y altura"
              onIonInput={(e) => set('domicilio', e.detail.value ?? '')} />
          </div>

          <div className="field">
            <label className="field-label">Provincia</label>
            <Autocomplete value={form.provincia || ''} options={PROVINCIAS}
              placeholder="Escribí para buscar…" onChange={setProvincia} />
          </div>

          {!esCaba && (
            <div className="field">
              <label className="field-label">Localidad / Partido</label>
              <Input value={form.localidad}
                onIonInput={(e) => set('localidad', e.detail.value ?? '')} />
            </div>
          )}

          <div className="field">
            <label className="field-label">Barrio</label>
            {esCaba ? (
              <Autocomplete value={form.barrio || ''} options={BARRIOS_CABA}
                placeholder="Escribí para buscar…" onChange={(v) => set('barrio', v)} />
            ) : (
              <Input value={form.barrio}
                onIonInput={(e) => set('barrio', e.detail.value ?? '')} />
            )}
          </div>

          <div className="field">
            <label className="field-label">Ocupación</label>
            <Input value={form.ocupacion} autocapitalize="words"
              onIonInput={(e) => set('ocupacion', capitalizar(e.detail.value ?? ''))} />
          </div>

          <div className="field">
            <label className="field-label">Profesión</label>
            <Input value={form.profesion} autocapitalize="words"
              onIonInput={(e) => set('profesion', capitalizar(e.detail.value ?? ''))} />
          </div>

          {/* Botón de guardar fijo en el footer del Layout. */}
        </form>

        <IonToast
          isOpen={ok}
          message="Perfil guardado"
          icon={checkmarkCircle}
          duration={1800}
          position="top"
          cssClass="toast-lla toast-lla-ok"
          onDidDismiss={() => setOk(false)}
        />
        <IonToast
          isOpen={!!error}
          message={error ?? ''}
          icon={alertCircle}
          duration={2600}
          position="top"
          cssClass="toast-lla toast-lla-error"
          onDidDismiss={() => setError(null)}
        />
      </IonContent>
    </Layout>
  );
};

export default MiPerfil;
