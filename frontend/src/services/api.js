const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const AUTH_TOKEN_KEY = 'mfd_access_token';

export const getAuthToken = () => sessionStorage.getItem(AUTH_TOKEN_KEY);

export const clearAuthToken = () => sessionStorage.removeItem(AUTH_TOKEN_KEY);

const apiRequest = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('json')
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const message = typeof body === 'object' && body !== null
      ? body.detail || body.message || body.error
      : body;
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return body;
};

const setAuthenticatedResponse = (response) => {
  if (!response?.token || !response.profile) {
    throw new Error('The server returned an incomplete authentication response.');
  }
  sessionStorage.setItem(AUTH_TOKEN_KEY, response.token);
  return response;
};

export const registerAccount = async (profile) => setAuthenticatedResponse(await apiRequest('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify(profile),
}));

export const loginAccount = async (credentials) => setAuthenticatedResponse(await apiRequest('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify(credentials),
}));

export const getCurrentProfile = () => apiRequest('/api/auth/me');

export const getLatestDocument = () => apiRequest('/api/documents/latest');

export const getDocuments = () => apiRequest('/api/documents');

export const getDocumentReport = (documentId) => apiRequest(
  `/api/documents/${encodeURIComponent(documentId)}`
);

export const saveAnalysisReport = (fileName, report) => apiRequest('/api/documents', {
  method: 'POST',
  body: JSON.stringify({ fileName, report }),
});

export const getEmailConnections = () => apiRequest('/api/email/connection');

export const startEmailConnection = (provider) => apiRequest(
  `/api/email/connect/${encodeURIComponent(provider)}`
);

export const searchEmailMessages = ({ provider, query, after, before }) => {
  const parameters = new URLSearchParams({ provider });
  if (query) parameters.set('query', query);
  if (after) parameters.set('after', after);
  if (before) parameters.set('before', before);
  return apiRequest(`/api/email/messages?${parameters.toString()}`);
};

export const getEmailImports = () => apiRequest('/api/email/imports');

export const importEmailAttachment = (selection) => apiRequest('/api/email/import', {
  method: 'POST',
  body: JSON.stringify(selection),
});

export const updateEmailImportStatus = (importId, status, documentId) => apiRequest(
  `/api/email/imports/${encodeURIComponent(importId)}/status`,
  {
    method: 'POST',
    body: JSON.stringify({ status, documentId }),
  }
);

export const deleteEmailImport = (importId) => apiRequest(
  `/api/email/imports/${encodeURIComponent(importId)}`,
  { method: 'DELETE' }
);

export const disconnectEmailProvider = (provider) => apiRequest(
  `/api/email/connection/${encodeURIComponent(provider)}`,
  { method: 'DELETE' }
);

export const listEmailAttachments = (provider, messageId) => {
  const parameters = new URLSearchParams({ provider });
  return apiRequest(`/api/email/messages/${encodeURIComponent(messageId)}/attachments?${parameters.toString()}`);
};
