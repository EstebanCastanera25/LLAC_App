import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export type ProtectionLevel = 'auth' | 'approved' | 'fiscal';

interface ProtectedProps extends RouteProps {
  component: React.ComponentType<object>;
  level: ProtectionLevel;
}

/**
 * Ruta protegida por el estado del usuario de la app:
 *  - 'auth'     → autenticado (perfil completo o no).
 *  - 'approved' → autenticado + perfil completo + estado 'aprobado'.
 *  - 'fiscal'   → 'approved' + perfil 'fiscal' + modo fiscalización habilitado.
 */
const Protected: React.FC<ProtectedProps> = ({ component: Component, level, ...rest }) => {
  const { isAuthenticated, user, loading, esFiscal, fiscalizacionEnabled } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (loading) return null;
        if (!isAuthenticated || !user) return <Redirect to="/login" />;
        // Las páginas de nivel 'auth' (completar-perfil, pendiente) se muestran
        // apenas hay sesión, sin depender de perfilCompleto (si no, /completar-perfil
        // se redirige a sí misma en loop → pantalla en blanco).
        if (level === 'auth') return <Component {...props} />;

        if (!user.perfilCompleto) return <Redirect to="/completar-perfil" />;
        if (user.estado !== 'aprobado') return <Redirect to="/pendiente" />;
        if (level === 'approved') return <Component {...props} />;

        // level === 'fiscal'
        if (!fiscalizacionEnabled || !esFiscal) return <Redirect to="/inicio" />;
        return <Component {...props} />;
      }}
    />
  );
};

export default Protected;
