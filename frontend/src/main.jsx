import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@asgardeo/auth-react';
import App from './App.jsx';
import './index.css';

const authConfig = {
  signInRedirectURL: import.meta.env.VITE_SIGN_IN_REDIRECT || window.location.origin,
  signOutRedirectURL: import.meta.env.VITE_SIGN_OUT_REDIRECT || window.location.origin,
  clientID: import.meta.env.VITE_ASGARDEO_CLIENT_ID,
  baseUrl: import.meta.env.VITE_ASGARDEO_BASE_URL,
  scope: ['openid', 'profile'],
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider config={authConfig}>
      <App />
    </AuthProvider>
  </StrictMode>
);
