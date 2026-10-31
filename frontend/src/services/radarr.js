import { getAuthToken } from './auth';

const API_BASE_URL = import.meta.env.API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function getHeaders() {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Initialisation sécurisée du cache localStorage
function initReleaseCache() {
  try {
    const saved = localStorage.getItem('releaseCache');
    if (saved) {
      return new Map(JSON.parse(saved));
    }
  } catch (err) {
    console.warn('Erreur lors du chargement du cache depuis localStorage :', err);
    localStorage.removeItem('releaseCache');
  }
  return new Map();
}

const releaseCache = initReleaseCache();

function saveCacheToStorage() {
  try {
    localStorage.setItem('releaseCache', JSON.stringify(Array.from(releaseCache.entries())));
  } catch (err) {
    console.warn('Impossible de sauvegarder le cache dans localStorage:', err);
  }
}

function clearReleaseCache() {
  releaseCache.clear();
  localStorage.removeItem('releaseCache');
}

/**
 * Invalide le cache pour un média spécifique selon son mediaType
 * mediaType: 'movie' | 'series'
 */
function clearReleaseCacheForMedia({ mediaType = 'movie', id, tmdbId, tvdbId }) {
  let hasDeleted = false;
  if (id) {
    const key = `${mediaType}:${id}`;
    if (releaseCache.has(key)) {
      releaseCache.delete(key);
      hasDeleted = true;
    }
  }
  if (mediaType === 'movie' && tmdbId) {
    const key = `tmdb:${tmdbId}`;
    if (releaseCache.has(key)) {
      releaseCache.delete(key);
      hasDeleted = true;
    }
  }
  if (mediaType === 'series' && tvdbId) {
    const key = `tvdb:${tvdbId}`;
    if (releaseCache.has(key)) {
      releaseCache.delete(key);
      hasDeleted = true;
    }
  }
  if (hasDeleted) {
    saveCacheToStorage();
  }
}

// Alias de rétrocompatibilité
function clearReleaseCacheForMovie(movieId, tmdbId) {
  clearReleaseCacheForMedia({ mediaType: 'movie', id: movieId, tmdbId });
}

/**
 * Vérification des trackers avec support mediaType ('movie' ou 'series')
 */
async function checkReleases({ mediaType = 'movie', movieId, seriesId, tmdbId, tvdbId }) {
  const targetId = movieId ?? seriesId;

  // Clé de cache compartimentée par mediaType
  let cacheKey;
  if (targetId) {
    cacheKey = `${mediaType}:${targetId}`;
  } else if (mediaType === 'series' && tvdbId) {
    cacheKey = `tvdb:${tvdbId}`;
  } else {
    cacheKey = `tmdb:${tmdbId}`;
  }

  // 1. Retour immédiat si présent dans le cache
  if (releaseCache.has(cacheKey)) {
    return releaseCache.get(cacheKey);
  }

  // 2. Appel API vers Radarr ou Sonarr
  const params = new URLSearchParams();
  let endpoint;

  if (mediaType === 'series') {
    endpoint = `${API_BASE_URL}/api/sonarr/releases/check`;
    if (targetId) params.append('series_id', targetId);
    if (tvdbId) params.append('tvdb_id', tvdbId);
  } else {
    endpoint = `${API_BASE_URL}/api/radarr/releases/check`;
    if (targetId) params.append('movie_id', targetId);
    if (tmdbId) params.append('tmdb_id', tmdbId);
  }

  const response = await fetch(`${endpoint}?${params.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.detail || errorJson?.message || `Erreur HTTP: ${response.status}`);
  }

  const json = await response.json();
  const data = json.data;

  // 3. Sauvegarde dans le cache
  if (data) {
    releaseCache.set(cacheKey, data);
    if (mediaType === 'movie' && data.tmdbId) {
      releaseCache.set(`tmdb:${data.tmdbId}`, data);
    }
    if (mediaType === 'series' && data.tvdbId) {
      releaseCache.set(`tvdb:${data.tvdbId}`, data);
    }
    saveCacheToStorage();
  }

  return data;
}


////////////
// MOVIES///
////////////

/**
 * Récupère tous les médias surveillés (films + séries)
 */
async function fetchAllMedias() {
  const response = await fetch(`${API_BASE_URL}/api/media/all`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.detail || errorJson?.message || `Erreur HTTP: ${response.status}`);
  }

  const json = await response.json();
  if (Array.isArray(json.data)) {
    return json.data;
  }
  return json.data?.all ?? [];
}

/**
 * Santé des trackers indexeurs
 */
async function getTrackers() {
  const response = await fetch(`${API_BASE_URL}/api/media/indexer-health`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.detail || errorJson?.message || `Erreur HTTP: ${response.status}`);
  }

  const json = await response.json();
  return json.data ?? [];
}

async function fetchMovies() {
  const response = await fetch(`${API_BASE_URL}/api/radarr/movies`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.detail || errorJson?.message || `Erreur HTTP: ${response.status}`);
  }

  const json = await response.json();
  return json.data ?? [];
}

async function fetchMovieDetails(movieId) {
  const response = await fetch(`${API_BASE_URL}/api/radarr/movies/${movieId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.detail || errorJson?.message || `Erreur HTTP: ${response.status}`);
  }

  const json = await response.json();
  return json.data ?? [];
}

async function addMovie(tmdbId, payload = {}) {
  const response = await fetch(`${API_BASE_URL}/api/radarr/movie/${tmdbId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.detail || errorJson?.message || `Erreur HTTP: ${response.status}`);
  }

  const json = await response.json();
  return json.data;
}

async function deleteMovie(movieId, deleteFiles = true) {
  const response = await fetch(`${API_BASE_URL}/api/radarr/movie/${movieId}?delete_files=${deleteFiles}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.detail || errorJson?.message || `Erreur HTTP: ${response.status}`);
  }

  clearReleaseCacheForMedia({ mediaType: 'movie', id: movieId });
  const json = await response.json();
  return json.data;
}

async function deleteSeries(seriesId, deleteFiles = true) {
  const response = await fetch(`${API_BASE_URL}/api/sonarr/series/${seriesId}?delete_files=${deleteFiles}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.detail || errorJson?.message || `Erreur HTTP: ${response.status}`);
  }

  clearReleaseCacheForMedia({ mediaType: 'series', id: seriesId });
  const json = await response.json();
  return json.data;
}

async function deleteMedia({ mediaType = 'movie', id, deleteFiles = true }) {
  if (mediaType === 'series') {
    return deleteSeries(id, deleteFiles);
  }
  return deleteMovie(id, deleteFiles);
}

///////////////
//// SERIES ///
///////////////


async function fetchSeries() {
  const response = await fetch(`${API_BASE_URL}/api/sonarr/series`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.detail || errorJson?.message || `Erreur HTTP: ${response.status}`);
  }

  const json = await response.json();
  return json.data ?? [];
}

async function fetchSeriesDetails(seriesId) {
  const response = await fetch(`${API_BASE_URL}/api/sonarr/series/${seriesId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.detail || errorJson?.message || `Erreur HTTP: ${response.status}`);
  }

  const json = await response.json();
  return json.data ?? [];
}

async function addSeries(tvdbId, payload = {}) {
  const response = await fetch(`${API_BASE_URL}/api/sonarr/series/${tvdbId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.detail || errorJson?.message || `Erreur HTTP: ${response.status}`);
  }

  const json = await response.json();
  return json.data;
}

export {
  fetchAllMedias,
  fetchMovies,
  fetchMovieDetails,
  checkReleases,
  clearReleaseCache,
  clearReleaseCacheForMedia,
  clearReleaseCacheForMovie,
  addMovie,
  deleteMovie,
  deleteSeries,
  deleteMedia,
  getTrackers,
  fetchSeries,
  fetchSeriesDetails,
  addSeries,
};