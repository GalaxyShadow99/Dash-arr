import { useState } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import MediaCard from '../components/MediaCard'
import { getAuthToken } from '../services/auth'
import { API_BASE_URL } from '../config'

async function mediaLookup(query, type) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  let response;
  if (type === 'movie') {
    response = await fetch(
      `${API_BASE_URL}/api/radarr/lookup?query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers,
      }
    );
  } else if (type === 'series') {
    response = await fetch(
      `${API_BASE_URL}/api/sonarr/lookup?term=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers,
      }
    );
  }

  if (!response) {
    throw new Error('Type de média non supporté.');
  }

  const json = await response.json().catch(() => null);

  if (!response.ok || !json?.success) {
    throw new Error(json?.detail || json?.message || 'Échec de la recherche');
  }

  return json;
}

export default function CreateMedia() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('movie')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSearched(true);
      const res = await mediaLookup(query, type);
      setResults(res.data ?? []);
    } catch (err) {
      console.error("Erreur lors de la recherche TMDB/Radarr :", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  let content = null;

  if (loading) {
    content = (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={30} />
        <Typography color="text.secondary">Recherche en cours...</Typography>
      </Box>
    );
  } else if (error) {
    content = (
      <Alert severity="error" sx={{ my: 3 }}>
        Erreur de recherche : {error}
      </Alert>
    );
  } else if (searched && results.length === 0) {
    content = (
      <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        Aucun résultat trouvé pour "{query}".
      </Typography>
    );
  } else if (results.length > 0) {
    content = (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
          Résultats ({results.length})
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 3,
            mt: 2,
          }}
        >
          {results.map((item, index) => {
            const poster = item.images?.find((img) => img.coverType === 'poster')?.remoteUrl
              ?? item.images?.[0]?.remoteUrl

            return (
              <MediaCard
                key={`${type}-${item.tvdbId || item.tmdbId || index}`}
                mediaType={type}
                movieId={type === 'movie' && item.id > 0 ? item.id : null}
                seriesId={type === 'series' && item.id > 0 ? item.id : null}
                tmdbId={item.tmdbId}
                tvdbId={item.tvdbId}
                title={item.title}
                overview={item.overview}
                imageUrl={poster}
                hasFile={item.hasFile ?? (item.statistics?.episodeFileCount > 0)}
                imdbId={item.imdbId}
                addToWishlistButton={true}
                fetchReleases={false}
              />
            )
          })}
        </Box>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Container maxWidth="sm" sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ textAlign: 'center' }}>
          Ajouter un média
        </Typography>
        <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nom du média"
              name="mediaName"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              variant="outlined"
              placeholder="Ex: Fight Club..."
              fullWidth
              required
            />
            <Select onSubmit={handleSubmit} onSelect={(eventKey) => setType(eventKey)}
              labelId="demo-simple-select-label"
              name="mediaType"
              id="demo-simple-select"
              value={type}
              label="Type"
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value={'series'}>Série</MenuItem>
              <MenuItem value={'movie'}>Film</MenuItem>
            </Select>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={30} color="inherit" /> : null}
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </Button>
          </Box>
        </Card>
      </Container>

      {content}
    </Container>
  );
}
