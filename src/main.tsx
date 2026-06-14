import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { loadRuntimeConfig } from './config';

const container = document.getElementById('root');
const root = createRoot(container!);

// Cargamos la config del backend antes de renderizar (best-effort: si falla, se
// usa el fallback de cache/env y la app igual arranca).
loadRuntimeConfig().finally(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
