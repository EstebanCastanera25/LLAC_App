import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useFiscalData } from './FiscalDataContext';
import { useAuth } from './AuthContext';

interface FiscalRouteProps extends RouteProps {
  component: React.ComponentType<object>;
}

/**
 * Rutas del flujo de fiscalización que requieren un fiscal ya buscado.
 * Gate: autenticado → perfil completo → aprobado → modo fiscalización habilitado
 * + perfil 'fiscal' → fiscalData cargada.
 */
const FiscalRoute: React.FC<FiscalRouteProps> = ({ component: Component, ...rest }) => {
  const { isAuthenticated, user, loading, esFiscal, fiscalizacionEnabled } = useAuth();
  const { hasFiscalData } = useFiscalData();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (loading) return null;
        if (!isAuthenticated || !user) return <Redirect to="/login" />;
        if (!user.perfilCompleto) return <Redirect to="/completar-perfil" />;
        if (user.estado !== 'aprobado') return <Redirect to="/pendiente" />;
        if (!fiscalizacionEnabled || !esFiscal) return <Redirect to="/inicio" />;
        if (!hasFiscalData) return <Redirect to="/fiscalizacion-lookup" />;
        return <Component {...props} />;
      }}
    />
  );
};

export default FiscalRoute;
