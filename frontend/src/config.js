/**
 * Configuration centralisee du Frontend Dasharr
 * Validation stricte des variables d'environnement (crash au chargement si manquante)
 */

const rawApiUrl = import.meta.env.VITE_API_URL ?? import.meta.env.API_URL;

if (!rawApiUrl || typeof rawApiUrl !== 'string' || rawApiUrl.trim() === '') {
  throw new Error(
    "[FATAL ERROR] La variable d'environnement VITE_API_URL est manquante ou vide. " +
    "Veuillez definir VITE_API_URL dans votre fichier .env (ex: VITE_API_URL=http://localhost:20000)."
  );
}

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');
