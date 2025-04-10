import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Redirecionar para a página estática
window.location.href = '/index.html';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}