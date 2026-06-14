import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.fiscalizacionapp',
  appName: 'fiscalizacionApp',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    // El callback de Auth0 vuelve por deep link y lo captura @capacitor/app (appUrlOpen).
    // El scheme/host del deep link debe coincidir con VITE_AUTH0_CALLBACK y con las
    // Allowed Callback URLs del dashboard de Auth0.
  },
};

export default config;
