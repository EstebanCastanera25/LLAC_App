import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import Login from './Login';
import { AuthContext, AuthContextType } from '../AuthContext';
import { vi } from 'vitest';
import { FiscalDataProvider } from '../FiscalDataContext';

const renderWithAuth = (authValue: Partial<AuthContextType> = {}) => {
  const defaultAuth: AuthContextType = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    esFiscal: false,
    fiscalizacionEnabled: false,
    loginWithGoogle: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    refreshMe: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    homeRoute: vi.fn().mockReturnValue('/login'),
  };
  const value = { ...defaultAuth, ...authValue } as AuthContextType;
  const history = createMemoryHistory({ initialEntries: ['/login'] });
  const utils = render(
    <AuthContext.Provider value={value}>
      <FiscalDataProvider>
        <Router history={history}>
          <Login />
        </Router>
      </FiscalDataProvider>
    </AuthContext.Provider>
  );
  return { ...utils, history, auth: value };
};

describe('Login', () => {
  test('calls loginWithGoogle when button is clicked', async () => {
    const { getByText, auth } = renderWithAuth();
    fireEvent.click(getByText('Ingresar con Google'));

    await waitFor(() => {
      expect(auth.loginWithGoogle).toHaveBeenCalled();
    });
  });
});
