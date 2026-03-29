import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UserProfileProvider } from './contexts/UserProfileContext';
import App from './App.jsx';
import './index.css';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProfileProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </UserProfileProvider>
  </StrictMode>
);
