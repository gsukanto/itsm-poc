import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { store } from './store';
import { App } from './App';

const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID;
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
const useMsal = !!tenantId && !!clientId;

const msalInstance = useMsal
  ? new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: window.location.origin,
      },
      cache: { cacheLocation: 'localStorage' },
    })
  : null;

const theme = createTheme({
  palette: { mode: 'light', primary: { main: '#0057B7' }, secondary: { main: '#7B1FA2' } },
  shape: { borderRadius: 6 },
});

const root = (
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </Provider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  msalInstance ? <MsalProvider instance={msalInstance}>{root}</MsalProvider> : root,
);
