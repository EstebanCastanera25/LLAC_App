import React, { useEffect, useRef, useState } from 'react';
import Input from './Input';

interface PhoneInputProps {
  /** Teléfono completo (ej. "+54 1123456789"). */
  value: string;
  onChange: (value: string) => void;
}

/** Separa "+54 11..." en { codigo, numero }. Default de código: +54. */
function split(tel: string): { codigo: string; numero: string } {
  const t = (tel || '').trim();
  const m = t.match(/^(\+\d{1,4})\s*(.*)$/);
  if (m) return { codigo: m[1], numero: m[2].trim() };
  return { codigo: '+54', numero: t };
}

/** Normaliza el número de CABA: 011/015/15 → 11XXXXXXXX (solo dígitos). */
function normalizarNumero(n: string): string {
  let d = (n || '').replace(/\D/g, '');
  if (d.startsWith('011')) d = '11' + d.slice(3);
  else if (d.startsWith('015')) d = '11' + d.slice(3);
  else if (d.startsWith('15')) d = '11' + d.slice(2);
  return d;
}

/** Teléfono con 2 casilleros: código de país (+54 por defecto) y número. */
const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange }) => {
  const inicial = split(value);
  const [codigo, setCodigo] = useState(inicial.codigo);
  const [numero, setNumero] = useState(inicial.numero);
  const ultimoEmitido = useRef(value);

  // Re-sincroniza solo cuando el valor cambia desde afuera (ej. precarga),
  // no cuando el cambio vino de este mismo componente (evita loop).
  useEffect(() => {
    if (value !== ultimoEmitido.current) {
      const s = split(value);
      setCodigo(s.codigo);
      setNumero(s.numero);
      ultimoEmitido.current = value;
    }
  }, [value]);

  const emitir = (c: string, n: string) => {
    const v = n.trim() ? `${c.trim()} ${n.trim()}` : '';
    ultimoEmitido.current = v;
    onChange(v);
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ flex: '0 0 92px' }}>
        <Input
          value={codigo}
          inputMode="tel"
          maxLength={5}
          onIonInput={(e) => {
            const c = (e.detail.value ?? '').replace(/[^\d+]/g, '');
            (e.target as HTMLIonInputElement).value = c;
            setCodigo(c);
            emitir(c, numero);
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <Input
          value={numero}
          type="tel"
          inputMode="numeric"
          placeholder="1123456789"
          onIonInput={(e) => {
            const n = (e.detail.value ?? '').replace(/\D/g, '');
            (e.target as HTMLIonInputElement).value = n;
            setNumero(n);
            emitir(codigo, n);
          }}
          onIonBlur={() => {
            const n = normalizarNumero(numero);
            setNumero(n);
            emitir(codigo, n);
          }}
        />
      </div>
    </div>
  );
};

export default PhoneInput;
