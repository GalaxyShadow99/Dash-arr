/**
 * Configuration centralisee du Frontend Dasharr
 * - En production (Docker) : VITE_API_URL peut etre vide pour que le navigateur
 *   utilise des requetes relatives ("/api/...") rootees en prive par Nginx vers le backend Docker.
 * - En developpement local : VITE_API_URL=http://localhost:8000 pour joindre le backend FastAPI direct.
 */

const rawApiUrl = import.meta.env.VITE_API_URL ?? import.meta.env.API_URL ?? '';

export const API_BASE_URL = typeof rawApiUrl === 'string' && rawApiUrl.trim() !== ''
  ? rawApiUrl.trim().replace(/\/+$/, '')
  : '';
