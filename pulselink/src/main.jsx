import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TriageProvider } from './context/TriageContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <TriageProvider>
        <App />
      </TriageProvider>
    </BrowserRouter>
  </StrictMode>
);
