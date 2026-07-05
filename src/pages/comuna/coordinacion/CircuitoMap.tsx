import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap, useMapEvents, AttributionControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { IonSpinner } from '@ionic/react';
import { fetchCircuitoFeature, fetchComunaFeatures, featuresBounds, type GeoFeature } from '../../../utils/geo';

export interface MapaPunto {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

interface Props {
  comunaNumero: number | null;
  /** Si viene, muestra ese circuito. Si se omite, muestra TODOS los de la comuna. */
  circuitoNumero?: string;
  markers?: MapaPunto[];
  /** Modo "elegir ubicación": clic en el mapa dispara onPick. */
  picker?: boolean;
  value?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  /** Cuando cambia, recentra el mapa en este punto (ej. tras buscar una dirección). */
  focus?: { lat: number; lng: number } | null;
  height?: number | string;
}

/** Recentra el mapa cuando cambia `focus` (búsqueda por dirección). */
const Recenter: React.FC<{ focus?: { lat: number; lng: number } | null }> = ({ focus }) => {
  const map = useMap();
  useEffect(() => {
    if (focus) map.setView([focus.lat, focus.lng], 16);
  }, [focus, map]);
  return null;
};

/** Ajusta el viewport a los bounds dados. */
const FitBounds: React.FC<{ bounds: [[number, number], [number, number]] | null }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [16, 16] });
  }, [bounds, map]);
  return null;
};

/** Captura clics para el modo picker. */
const ClickCapture: React.FC<{ onPick?: (lat: number, lng: number) => void }> = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const CircuitoMap: React.FC<Props> = ({
  comunaNumero,
  circuitoNumero,
  markers = [],
  picker = false,
  value = null,
  onPick,
  focus = null,
  height = 300,
}) => {
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    setError(null);
    const promesa = circuitoNumero
      ? fetchCircuitoFeature(comunaNumero, circuitoNumero).then((f) => (f ? [f] : []))
      : fetchComunaFeatures(comunaNumero);
    promesa
      .then((fs) => {
        if (!vivo) return;
        setFeatures(fs);
        if (!fs.length) setError('No se encontró la geometría del mapa.');
      })
      .catch((e) => vivo && setError(e.message))
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, [comunaNumero, circuitoNumero]);

  if (loading) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IonSpinner name="crescent" />
      </div>
    );
  }
  if (error || !features.length) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, textAlign: 'center', color: 'var(--ion-color-medium)' }}>
        {error || 'Mapa no disponible'}
      </div>
    );
  }

  const bounds = featuresBounds(features);
  const mid: [number, number] = bounds
    ? [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2]
    : [-34.63, -58.45];

  return (
    <div style={{ height }}>
      <MapContainer center={mid} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} attributionControl={false}>
        <AttributionControl prefix="La Libertad Avanza" />
        <TileLayer
          attribution=""
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {features.map((f) => (
          <GeoJSON
            key={`${comunaNumero}-${f.properties?.ID}`}
            data={f as GeoJSON.Feature}
            style={{ color: '#4B296B', weight: 2, fillColor: '#7B4BA6', fillOpacity: 0.12 }}
          />
        ))}
        <FitBounds bounds={bounds} />
        <Recenter focus={focus} />
        {picker && <ClickCapture onPick={onPick} />}

        {markers.map((m, i) => (
          <CircleMarker
            key={i}
            center={[m.lat, m.lng]}
            radius={6}
            pathOptions={{ color: m.color || '#2d6cdf', fillColor: m.color || '#2d6cdf', fillOpacity: 0.9 }}
          >
            {m.label && <Popup>{m.label}</Popup>}
          </CircleMarker>
        ))}

        {value && (
          <CircleMarker
            center={[value.lat, value.lng]}
            radius={9}
            pathOptions={{ color: '#c0392b', fillColor: '#e74c3c', fillOpacity: 0.95 }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default CircuitoMap;
