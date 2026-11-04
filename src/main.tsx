import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './lib/auth';
// ui.css also brings in styles.css (as a lower layer).
import './ui/ui.css';

const root = document.getElementById('root')!;
// #root holds the server's crawlable HTML; React takes over from here.
root.innerHTML = '';
createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
