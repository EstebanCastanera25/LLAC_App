import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { logoGoogle } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Login.css';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const Login: React.FC = () => {
  const history = useHistory();
  const { loginWithGoogle, isAuthenticated, loading, homeRoute } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const seq = useRef(0);

  // Si ya hay sesión, saltar al destino que corresponda.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      history.replace(homeRoute());
    }
  }, [loading, isAuthenticated, history, homeRoute]);

  // Anillos de fondo: agrega uno cada 2s y mantiene los últimos 5.
  useEffect(() => {
    const id = window.setInterval(() => {
      seq.current += 1;
      setRipples((prev) => [
        ...prev.slice(-4),
        { id: seq.current, x: Math.random() * 100, y: Math.random() * 100 },
      ]);
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  const handleGoogleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError('No se pudo iniciar sesión con Google');
      setBusy(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-content">
        <div className="login-container">
          {/* Anillos de fondo */}
          <div className="ripple-container">
            {ripples.map((r) => (
              <div
                key={r.id}
                className="ripple-wrapper"
                style={{ left: `${r.x}%`, top: `${r.y}%` }}
              >
                <div className="ripple-group">
                  <div className="ripple ripple-1" />
                  <div className="ripple ripple-2" />
                  <div className="ripple ripple-3" />
                </div>
              </div>
            ))}
          </div>

          {/* Tarjeta */}
          <div className="card-wrapper">
            <div className="shadow-layer shadow-outer" />
            <div className="shadow-layer shadow-inner" />

            <div className="login-card">
              <div className="logo-container">
                <div className="pulse-ring" />
                <div className="logo-box">
                  <img src="/assets/logo-lla.png" alt="La Libertad Avanza" />
                </div>
              </div>

              <div className="login-title-container">
                <h1 className="login-title">¡Bienvenidos!</h1>
                <p className="login-subtitle">Ingresá con tu cuenta de Google para continuar</p>
              </div>

              {error && (
                <div className="login-error">
                  <span>{error}</span>
                </div>
              )}

              <button className="google-button" onClick={handleGoogleLogin} disabled={busy}>
                <IonIcon icon={logoGoogle} />
                <span className="button-text">
                  {busy ? 'Conectando…' : 'Ingresar con Google'}
                </span>
                <div className="button-hover-effect" />
              </button>
            </div>
          </div>

          {/* Overlay de carga */}
          {busy && (
            <div className="spinner-overlay">
              <div className="spinner-container">
                <div className="spinner-ring" />
                <div className="spinner-ring spinner-ring-delay" />
                <div className="spinner-text">Conectando…</div>
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
