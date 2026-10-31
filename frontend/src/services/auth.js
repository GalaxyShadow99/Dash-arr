const API_BASE_URL = import.meta.env.API_URL;
if (!API_BASE_URL) {
  throw new Error("La variable d'environnement API_URL n'est pas définie.");
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.detail || json.message || 'Échec de la connexion');
  }

  // Stocke le token JWT pour toutes les futures requêtes
  if (json.data?.access_token) {
    localStorage.setItem('auth_token', json.data.access_token);
    localStorage.setItem('auth_email', json.data.email);
  }

  return json.data;
}

export function getAuthToken() {
  return localStorage.getItem('auth_token');
}

export function logoutUser() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_email');
}

export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;
    const decodedJson = JSON.parse(atob(payloadBase64));
    const exp = decodedJson.exp;
    if (!exp) return false;

    // Source - https://stackoverflow.com/a/51293316
    // License - CC BY-SA 4.0
    return Boolean(Date.now() >= exp * 1000);
  } catch {
    return true;
  }
}

export async function checkAuthToken() {
  const token = getAuthToken();
  if (!token || isTokenExpired(token)) {
    logoutUser();
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/radarr/movies`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      logoutUser();
      return false; // Token is invalid or expired
    }

    return true; // Token is valid
  } catch {
    return false;
  }
}

export function isAuthenticated() {
  const token = getAuthToken();
  if (!token || isTokenExpired(token)) {
    logoutUser();
    return false;
  }
  return true;
}