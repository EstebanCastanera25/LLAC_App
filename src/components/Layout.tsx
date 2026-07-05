import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonFooter,
  IonIcon,
  IonPopover,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/react';
import { chevronBackOutline, personCircleOutline, personOutline, logOutOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getMemberNameParts, useFiscalData } from '../FiscalDataContext';
import type { FiscalData } from '../FiscalDataContext';
import NotificacionesBell from './NotificacionesBell';



interface LayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  backHref?: string;
}
const joinMemberName = (apellidos?: string, nombres?: string) => {
  if (apellidos && nombres) {
    return `${apellidos}, ${nombres}`;
  }

  return apellidos || nombres || '';
};

const APP_TITLE = 'Comuna 7';

export function formatTitle(fd?: FiscalData | null) {
  const baseTitle = APP_TITLE;
  if (!fd) return baseTitle;

  const normalizedApellidos =
    typeof fd.apellidos_miembro === 'string' ? fd.apellidos_miembro.trim() : '';
  const normalizedNombres =
    typeof fd.nombres_miembro === 'string' ? fd.nombres_miembro.trim() : '';

  const { apellidos, nombres, displayName } = getMemberNameParts(fd);

  if (normalizedApellidos || normalizedNombres) {
    const normalizedTitle = joinMemberName(normalizedApellidos, normalizedNombres);
    if (normalizedTitle) {
      return normalizedTitle;
    }
  }

  if (displayName) {
    return displayName;
  }

  const fallbackTitle = joinMemberName(apellidos, nombres);
  if (fallbackTitle) {
    return fallbackTitle;
  }

  return baseTitle;
}
const Layout: React.FC<LayoutProps> = ({ children, footer, backHref }) => {
  const { logout, isAuthenticated } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const { fiscalData, setFiscalData } = useFiscalData();
  const [menu, setMenu] = useState<{ open: boolean; event?: Event }>({ open: false });

  const HIDE_NAME_ROUTES = ['/login', '/fiscalizacion-lookup'];
  const isHideName = HIDE_NAME_ROUTES.some((r) =>
    location.pathname === r || location.pathname.startsWith(`${r}/`)
  );

  const HIDE_LOGOUT_ROUTES = ['/login'];
  const shouldHideLogout = HIDE_LOGOUT_ROUTES.some((r) => location.pathname === r);

  const title = isHideName ? APP_TITLE : formatTitle(fiscalData);
  const showLogout = isAuthenticated && !shouldHideLogout;

  const handleLogout = useCallback(async () => {
    setFiscalData?.(null);
    try {
      localStorage.removeItem('fiscalData');
    } catch {
      // Ignore errors removing fiscalData from localStorage
    }
    await logout();
    history.replace('/login');
  }, [history, logout, setFiscalData]);

  const hasLoggedOutRef = useRef(false);

  useEffect(() => {
    if (shouldHideLogout && isAuthenticated && !hasLoggedOutRef.current) {
      hasLoggedOutRef.current = true;
      void handleLogout();
      return;
    }

    if (!shouldHideLogout) {
      hasLoggedOutRef.current = false;
    }
  }, [handleLogout, isAuthenticated, shouldHideLogout]);

  return (
    <IonPage>
      <IonHeader className="bg-primary-500 text-white">
        <IonToolbar className="flex justify-between items-center px-4">
          {backHref ? (
            <IonButtons slot="start">
              <IonButton
                color="light"
                className="font-semibold"
                onClick={() => history.push(backHref)}
              >
                <IonIcon icon={chevronBackOutline} slot="start" />
                Volver
              </IonButton>
            </IonButtons>
          ) : (
            <img
              slot="start"
              src="/assets/logo-lla-mark.png"
              alt="La Libertad Avanza"
              style={{ height: 40, width: 'auto', objectFit: 'contain', marginInlineStart: 12 }}
            />
          )}
          <IonTitle className="font-bold text-lg">{title}</IonTitle>
          {showLogout && (
            <IonButtons slot="end">
              <NotificacionesBell />
              <IonButton
                color="light"
                aria-label="Menú de perfil"
                onClick={(e) => setMenu({ open: true, event: e.nativeEvent })}
              >
                <IonIcon slot="icon-only" icon={personCircleOutline} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonPopover
        isOpen={menu.open}
        event={menu.event}
        onDidDismiss={() => setMenu({ open: false })}
        alignment="end"
        side="bottom"
      >
        <IonContent>
          <IonList>
            <IonItem
              button
              detail={false}
              onClick={() => { setMenu({ open: false }); history.push('/comuna/perfil'); }}
            >
              <IonIcon icon={personOutline} slot="start" />
              <IonLabel>Mi Perfil</IonLabel>
            </IonItem>
            <IonItem
              button
              detail={false}
              lines="none"
              onClick={() => { setMenu({ open: false }); void handleLogout(); }}
            >
              <IonIcon icon={logOutOutline} slot="start" color="danger" />
              <IonLabel color="danger">Salir</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonPopover>
      {children}
      {footer && <IonFooter>{footer}</IonFooter>}
    </IonPage>
  );
};

export default Layout;
