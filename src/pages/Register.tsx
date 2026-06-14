import React from 'react';
import { Redirect } from 'react-router-dom';

/**
 * El registro ahora es automático vía Google (Auth0) + aprobación del admin.
 * Esta ruta queda como redirección al login para no romper enlaces antiguos.
 */
const Register: React.FC = () => <Redirect to="/login" />;

export default Register;
