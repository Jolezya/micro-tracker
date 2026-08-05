import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { StoreProvider } from './lib/store.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import './index.css';

// Artifact entry: HashRouter so client-side routing works reliably when the
// app is served from an arbitrary base path inside a sandboxed iframe.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <StoreProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </StoreProvider>
    </HashRouter>
  </React.StrictMode>
);
