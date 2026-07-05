import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { logoWhatsapp, callOutline } from 'ionicons/icons';

/** Normaliza un teléfono argentino a la parte local (sin 54 ni 9 iniciales). */
function localAR(telefono?: string): string {
  const d = (telefono || '').replace(/\D/g, '');
  if (!d) return '';
  return (d.startsWith('54') ? d.slice(2) : d).replace(/^9/, '');
}

/** Botones de contacto (WhatsApp + llamar) para un teléfono argentino. */
const ContactoAcciones: React.FC<{ telefono?: string }> = ({ telefono }) => {
  const local = localAR(telefono);
  if (!local) return null;
  const wa = `https://wa.me/549${local}`;
  const tel = `tel:+54${local}`;
  return (
    <div slot="end" style={{ display: 'flex', gap: 2 }}>
      <IonButton fill="clear" onClick={() => window.open(wa, '_blank')} aria-label="WhatsApp">
        <IonIcon slot="icon-only" icon={logoWhatsapp} color="success" />
      </IonButton>
      <IonButton fill="clear" onClick={() => window.open(tel, '_blank')} aria-label="Llamar">
        <IonIcon slot="icon-only" icon={callOutline} color="primary" />
      </IonButton>
    </div>
  );
};

export default ContactoAcciones;
