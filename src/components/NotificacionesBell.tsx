import React, { useCallback, useEffect, useState } from 'react';
import {
  IonButton, IonIcon, IonBadge, IonPopover, IonContent, IonList, IonItem, IonLabel, IonNote,
} from '@ionic/react';
import {
  notificationsOutline, calendarOutline, megaphoneOutline, personOutline, newspaperOutline, alertCircleOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { getNotificaciones, marcarLeidas, type Notif } from '../services/notificaciones';

function iconoDe(icono: string): string {
  switch (icono) {
    case 'calendar': return calendarOutline;
    case 'megaphone': return megaphoneOutline;
    case 'person': return personOutline;
    case 'newspaper': return newspaperOutline;
    default: return alertCircleOutline;
  }
}

const NotificacionesBell: React.FC = () => {
  const history = useHistory();
  const [open, setOpen] = useState<{ open: boolean; event?: Event }>({ open: false });
  const [items, setItems] = useState<Notif[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);

  const cargar = useCallback(async () => {
    const r = await getNotificaciones();
    setItems(r.items);
    setNoLeidas(r.noLeidas);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const abrir = async (e: React.MouseEvent) => {
    setOpen({ open: true, event: e.nativeEvent });
    await marcarLeidas();
    await cargar(); // refresca el badge (bajan las de fecha; quedan las permanentes)
  };

  const ir = (n: Notif) => {
    setOpen({ open: false });
    history.push(n.link);
  };

  return (
    <>
      <IonButton color="light" aria-label="Notificaciones" onClick={abrir} style={{ position: 'relative' }}>
        <IonIcon slot="icon-only" icon={notificationsOutline} />
        {noLeidas > 0 && (
          <IonBadge
            color="danger"
            style={{
              position: 'absolute', top: 2, right: 2, fontSize: 10, lineHeight: '16px',
              minWidth: 16, height: 16, borderRadius: 8, padding: '0 4px',
            }}
          >
            {noLeidas > 9 ? '9+' : noLeidas}
          </IonBadge>
        )}
      </IonButton>

      <IonPopover
        isOpen={open.open}
        event={open.event}
        onDidDismiss={() => setOpen({ open: false })}
        alignment="end"
        side="bottom"
      >
        <IonContent style={{ '--min-width': '288px' } as React.CSSProperties}>
          <IonList>
            {items.length === 0 && (
              <IonItem lines="none"><IonLabel color="medium">Sin novedades</IonLabel></IonItem>
            )}
            {items.map((n) => (
              <IonItem key={n.id} button detail={false} lines="full" onClick={() => ir(n)}>
                <IonIcon icon={iconoDe(n.icono)} slot="start" color={n.leida ? 'medium' : 'primary'} />
                <IonLabel className="ion-text-wrap">
                  <h3 style={{ fontWeight: n.leida ? 400 : 600, margin: 0 }}>{n.titulo}</h3>
                  <IonNote>{n.detalle}</IonNote>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </IonContent>
      </IonPopover>
    </>
  );
};

export default NotificacionesBell;
