import { PublicClientApplication } from '@azure/msal-browser';

const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID;
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
const audience = import.meta.env.VITE_ENTRA_AUDIENCE ?? 'api://itsm';

let pca: PublicClientApplication | null = null;
if (tenantId && clientId) {
  pca = new PublicClientApplication({
    auth: { clientId, authority: `https://login.microsoftonline.com/${tenantId}`, redirectUri: window.location.origin },
    cache: { cacheLocation: 'localStorage' },
  });
}

export async function ensureLogin(): Promise<void> {
  if (!pca) return;
  await pca.initialize();
  const accounts = pca.getAllAccounts();
  if (accounts.length === 0) {
    await pca.loginRedirect({ scopes: [`${audience}/.default`] });
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (!pca) {
    const t = localStorage.getItem('dev_jwt');
    return t ? t.replace(/[\r\n\s]+/g, '') : null;
  }
  await pca.initialize();
  const accounts = pca.getAllAccounts();
  if (accounts.length === 0) return null;
  try {
    const result = await pca.acquireTokenSilent({ scopes: [`${audience}/.default`], account: accounts[0] });
    return result.accessToken;
  } catch {
    await pca.acquireTokenRedirect({ scopes: [`${audience}/.default`] });
    return null;
  }
}

export async function logout() {
  if (pca) {
    await pca.initialize();
    await pca.logoutRedirect();
  } else {
    localStorage.removeItem('dev_jwt');
    window.location.reload();
  }
}

export const isUsingMsal = !!pca;
