import React, { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  IonContent, IonList, IonItem, IonLabel, IonTextarea,
  IonButton, IonIcon, IonSpinner, IonText, IonInput, IonNote,
} from '@ionic/react';
import { cameraOutline, locateOutline, sendOutline, mapOutline, searchOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { useHistory } from 'react-router-dom';
import Layout from '../../../components/Layout';
import CircuitoMap from './CircuitoMap';
import {
  getReclamosContexto, crearReclamo, reverseGeocode, geocodeAddress,
} from '../../../services/coordinacion';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const MAX_DIM = 1600;
const JPEG_QUALITY = 0.8;
const MAX_UPLOAD_MB = 8;

/** Redimensiona (máx MAX_DIM px) y re-codifica a JPEG en canvas.
 *  Baja el peso y convierte HEIC/PNG → JPEG (formato que sharp decodifica en el backend).
 *  Lanza si el navegador no puede decodificar/exportar la imagen. */
async function procesarImagen(blob: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  try {
    const escala = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * escala);
    const h = Math.round(bmp.height * escala);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo procesar la imagen.');
    ctx.drawImage(bmp, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (out) => (out ? resolve(out) : reject(new Error('No se pudo procesar la imagen.'))),
        'image/jpeg',
        JPEG_QUALITY,
      );
    });
  } finally {
    bmp.close();
  }
}

/** Alta de un reclamo: foto + descripción + ubicación (GPS o mapa de la comuna).
 *  El circuito lo detecta el backend por la ubicación. */
const NuevoReclamo: React.FC = () => {
  const history = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [comunaNumero, setComunaNumero] = useState<number | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null);
  const [fotoPreview, setFotoPreview] = useState('');
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [direccion, setDireccion] = useState('');
  const [modoMapa, setModoMapa] = useState(false);
  const [buscarDir, setBuscarDir] = useState('');
  const [buscando, setBuscando] = useState(false);

  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    getReclamosContexto()
      .then((c) => vivo && setComunaNumero(c.comunaNumero))
      .catch((e) => vivo && setError((e as Error).message))
      .finally(() => vivo && setLoading(false));
    return () => { vivo = false; };
  }, []);

  /** Recomprime la foto antes de guardarla. Si el navegador no puede decodificarla,
   *  usa el original salvo que supere MAX_UPLOAD_MB (red de seguridad). */
  const prepararFoto = async (blob: Blob) => {
    let final = blob;
    try {
      final = await procesarImagen(blob);
    } catch {
      if (blob.size > MAX_UPLOAD_MB * 1024 * 1024) {
        setError(`La foto es muy pesada (máx ${MAX_UPLOAD_MB} MB). Probá con otra o sacala de nuevo.`);
        return;
      }
    }
    setFotoBlob(final);
    setFotoPreview(await blobToDataUrl(final));
    setError(null);
  };

  const tomarFoto = async () => {
    if (Capacitor.getPlatform() === 'web') {
      fileInputRef.current?.click();
      return;
    }
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        quality: 80,
        source: CameraSource.Camera,
        direction: CameraDirection.Rear,
      });
      if (photo.webPath) {
        const blob = await fetch(photo.webPath).then((r) => r.blob());
        await prepararFoto(blob);
      }
    } catch {
      fileInputRef.current?.click();
    }
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await prepararFoto(file);
  };

  const resolverDireccion = async (lat: number, lng: number) => {
    try {
      const geo = await reverseGeocode(lat, lng);
      setDireccion(geo.direccion || '');
    } catch {
      // La dirección es editable; si falla el geocoding el usuario la completa.
    }
  };

  const usarUbicacionActual = async () => {
    setGeoLoading(true);
    setError(null);
    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setPunto(p);
      setFocus({ ...p });
      await resolverDireccion(p.lat, p.lng);
    } catch {
      setError('No se pudo obtener tu ubicación. Elegila en el mapa.');
      setModoMapa(true);
    } finally {
      setGeoLoading(false);
    }
  };

  const onPickMapa = async (lat: number, lng: number) => {
    setPunto({ lat, lng });
    await resolverDireccion(lat, lng);
  };

  const buscarDireccion = async () => {
    const query = buscarDir.trim();
    if (!query) return;
    setBuscando(true);
    setError(null);
    try {
      const r = await geocodeAddress(query);
      if (!r) { setError('No se encontró esa dirección.'); return; }
      const p = { lat: r.lat, lng: r.lng };
      setPunto(p);
      setFocus({ ...p });
      setDireccion(r.direccion || query);
    } catch {
      setError('No se pudo buscar la dirección.');
    } finally {
      setBuscando(false);
    }
  };

  const enviar = async () => {
    setError(null);
    if (!fotoBlob) return setError('Sacá o subí una foto.');
    if (!punto) return setError('Marcá la ubicación del reclamo.');

    setEnviando(true);
    try {
      await crearReclamo({
        file: fotoBlob,
        descripcion: descripcion.trim(),
        lat: punto.lat,
        lng: punto.lng,
        direccion: direccion.trim(),
      });
      history.replace('/comuna/reclamos');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <Layout backHref="/comuna/reclamos">
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', marginTop: 32 }}><IonSpinner name="crescent" /></div>
        </IonContent>
      </Layout>
    );
  }

  return (
    <Layout backHref="/comuna/reclamos">
      <IonContent className="ion-padding">
        <h2 className="display-font" style={{ marginTop: 0 }}>Nuevo reclamo</h2>

        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFileChange} />

        <IonList>
          <IonItem>
            <IonLabel position="stacked">Descripción</IonLabel>
            <IonTextarea
              value={descripcion}
              onIonInput={(e) => setDescripcion(e.detail.value ?? '')}
              placeholder="Ej. Calle rota / luminaria caída…"
              autoGrow
            />
          </IonItem>
        </IonList>

        <IonButton expand="block" fill="outline" onClick={tomarFoto} style={{ marginTop: 12 }}>
          <IonIcon icon={cameraOutline} slot="start" /> {fotoBlob ? 'Cambiar foto' : 'Sacar / subir foto'}
        </IonButton>
        {fotoPreview && (
          <img
            src={fotoPreview}
            alt="Previsualización del reclamo"
            style={{ display: 'block', width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8, marginTop: 8 }}
          />
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <IonButton style={{ flex: 1, minWidth: 140 }} onClick={usarUbicacionActual} disabled={geoLoading}>
            <IonIcon icon={locateOutline} slot="start" />
            {geoLoading ? 'Ubicando…' : 'Mi ubicación'}
          </IonButton>
          <IonButton style={{ flex: 1, minWidth: 140 }} fill="outline" onClick={() => setModoMapa((v) => !v)}>
            <IonIcon icon={mapOutline} slot="start" /> {modoMapa ? 'Ocultar mapa' : 'Elegir en mapa'}
          </IonButton>
        </div>

        {modoMapa && (
          <div style={{ marginTop: 8 }}>
            <IonItem>
              <IonInput
                value={buscarDir}
                onIonInput={(e) => setBuscarDir(e.detail.value ?? '')}
                onKeyDown={(e) => { if (e.key === 'Enter') void buscarDireccion(); }}
                placeholder="Buscar dirección (calle y altura)"
              />
              <IonButton slot="end" onClick={buscarDireccion} disabled={buscando} aria-label="Buscar dirección">
                {buscando ? <IonSpinner name="crescent" /> : <IonIcon icon={searchOutline} slot="icon-only" />}
              </IonButton>
            </IonItem>
            <IonNote>Tocá el mapa o buscá una dirección para marcar la ubicación (dentro de la comuna).</IonNote>
            <CircuitoMap
              comunaNumero={comunaNumero}
              picker
              value={punto}
              onPick={onPickMapa}
              focus={focus}
              height="45vh"
            />
          </div>
        )}

        {punto && (
          <IonList style={{ marginTop: 8 }}>
            <IonItem>
              <IonLabel position="stacked">Dirección</IonLabel>
              <IonInput
                value={direccion}
                onIonInput={(e) => setDireccion(e.detail.value ?? '')}
                placeholder="Calle y altura"
              />
            </IonItem>
            <IonItem lines="none">
              <IonNote>{punto.lat.toFixed(5)}, {punto.lng.toFixed(5)}</IonNote>
            </IonItem>
          </IonList>
        )}

        {error && <IonText color="danger"><p>{error}</p></IonText>}

        <IonButton expand="block" onClick={enviar} disabled={enviando} style={{ marginTop: 16 }}>
          {enviando ? <IonSpinner name="crescent" /> : (<><IonIcon icon={sendOutline} slot="start" /> Enviar reclamo</>)}
        </IonButton>
      </IonContent>
    </Layout>
  );
};

export default NuevoReclamo;
