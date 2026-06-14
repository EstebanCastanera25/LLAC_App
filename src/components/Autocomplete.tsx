import React, { useEffect, useState } from 'react';
import { IonList, IonItem, IonLabel } from '@ionic/react';
import Input from './Input';

interface AutocompleteProps {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
}

/** Normaliza para buscar sin importar acentos ni mayúsculas. */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Campo de texto con autocompletado: el usuario escribe y se filtra la lista;
 * al elegir una opción se confirma el valor. Si pierde el foco sin elegir,
 * vuelve al último valor confirmado.
 */
const Autocomplete: React.FC<AutocompleteProps> = ({ value, options, placeholder, onChange }) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => { setQuery(value); }, [value]);

  const q = norm(query.trim());
  const filtradas = (q ? options.filter((o) => norm(o).includes(q)) : options).slice(0, 60);

  const elegir = (o: string) => {
    onChange(o);
    setQuery(o);
    setOpen(false);
  };

  return (
    <div className="autocomplete-wrap">
      <Input
        value={query}
        placeholder={placeholder}
        onIonFocus={() => setOpen(true)}
        onIonInput={(e) => { setQuery(e.detail.value ?? ''); setOpen(true); }}
        onIonBlur={() => setTimeout(() => { setOpen(false); setQuery(value); }, 180)}
      />
      {open && filtradas.length > 0 && (
        <div className="autocomplete-list">
          <IonList lines="full">
            {filtradas.map((o) => (
              <IonItem
                button
                detail={false}
                key={o}
                onMouseDown={(e) => { e.preventDefault(); elegir(o); }}
                onClick={() => elegir(o)}
              >
                <IonLabel>{o}</IonLabel>
              </IonItem>
            ))}
          </IonList>
        </div>
      )}
    </div>
  );
};

export default Autocomplete;
