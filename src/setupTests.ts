// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import { expect, vi } from 'vitest';
import matchers from '@testing-library/jest-dom/matchers';
import 'fake-indexeddb/auto';

expect.extend(matchers);

// Mock matchmedia when running in a browser-like environment
if (typeof window !== 'undefined') {
  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        addListener: function () {},
        removeListener: function () {},
      } as unknown as MediaQueryList;
    };
}

// Evitar que el SDK de Auth0 se inicialice durante los tests.
vi.mock('@auth0/auth0-spa-js', () => ({
  createAuth0Client: async () => ({
    loginWithRedirect: async () => undefined,
    handleRedirectCallback: async () => ({}),
    getTokenSilently: async () => 'test-token',
    logout: async () => undefined,
  }),
}));
