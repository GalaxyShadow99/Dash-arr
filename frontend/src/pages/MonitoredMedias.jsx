import { useEffect, useState } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

import MediaCard from '../components/MediaCard'
import { fetchAllMedias, getTrackers } from '../services/radarr'

export default function MonitoredMedias() {
  const [movies, setMovies] = useState([])
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [trackerList, setTrackerList] = useState([])
  const [trackerLoading, setTrackerLoading] = useState(true)
  const [trackerError, setTrackerError] = useState(null)

  useEffect(() => {
    async function loadMedias() {
      try {
        const data = await fetchAllMedias()
        const movieList = (Array.isArray(data) ? data : []).filter((item) => item.mediaType === 'movie')
        const seriesList = (Array.isArray(data) ? data : []).filter((item) => item.mediaType === 'series')
        setMovies(movieList)
        setSeries(seriesList)
      } catch (err) {
        console.error("Erreur lors de la récupération des médias :", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    async function loadTrackers() {
      try {
        setTrackerLoading(true)
        const data = await getTrackers()
        setTrackerList(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Erreur lors de la récupération des trackers :", err)
        setTrackerError(err.message)
      } finally {
        setTrackerLoading(false)
      }
    }
    loadMedias()
    loadTrackers()
  }, [])

  let content
  if (loading) {
    content = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
        <CircularProgress size={28} />
        <Typography color="text.secondary">Chargement des médias (films & séries)...</Typography>
      </Box>
    )
  } else if (error) {
    content = (
      <Alert severity="error" sx={{ my: 2 }}>
        {error === 'Not authenticated' ? (
          <span>
            Vous n'êtes pas authentifié. Veuillez vous connecter pour accéder à cette page.
          </span>
        ) : (
          <span>
            Erreur de chargement : {error}
          </span>
        )}
      </Alert>
    )
  } else if (!Array.isArray(movies) || movies.length === 0) {
    content = (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        Aucun média surveillé pour le moment :-(
      </Typography>
    )
  } else {
    content = (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5, mt: 3 }}>
        {/* Section Films */}
        <Box component="section">
          <Typography variant="h4" component="h2" fontWeight="bold" sx={{ mb: 2 }}>
            Films surveillés ({movies.length})
          </Typography>

          {movies.length === 0 ? (
            <Typography color="text.secondary">Aucun film surveillé pour le moment.</Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 3,
              }}
            >
              {movies.map((item) => {
                const poster = item.images?.find((img) => img.coverType === 'poster')?.remoteUrl
                  ?? item.images?.[0]?.remoteUrl

                return (
                  <MediaCard
                    key={`movie-${item.id ?? item.tmdbId ?? item.title}`}
                    mediaType="movie"
                    movieId={item.id}
                    tmdbId={item.tmdbId}
                    title={item.title}
                    overview={item.overview}
                    imageUrl={poster}
                    hasFile={item.hasFile}
                    imdbId={item.imdbId}
                    deleteFromWishlistButton={true}
                    onDelete={(deletedId) => {
                      setMovies((prev) => prev.filter((m) => m.id !== deletedId))
                    }}
                  />
                )
              })}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Section Séries */}
        <Box component="section">
          <Typography variant="h4" component="h2" fontWeight="bold" sx={{ mb: 2 }}>
            Séries surveillées ({series.length})
          </Typography>

          {series.length === 0 ? (
            <Typography color="text.secondary">Aucune série surveillée pour le moment.</Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 3,
              }}
            >
              {series.map((item) => {
                const poster = item.images?.find((img) => img.coverType === 'poster')?.remoteUrl
                  ?? item.images?.[0]?.remoteUrl

                return (
                  <MediaCard
                    key={`series-${item.id ?? item.tvdbId ?? item.title}`}
                    mediaType="series"
                    seriesId={item.id}
                    tvdbId={item.tvdbId}
                    title={item.title}
                    overview={item.overview}
                    imageUrl={poster}
                    hasFile={item.statistics?.episodeFileCount > 0}
                    imdbId={item.imdbId}
                    deleteFromWishlistButton={true}
                    onDelete={(deletedId) => {
                      setSeries((prev) => prev.filter((s) => s.id !== deletedId))
                    }}
                  />
                )
              })}
            </Box>
          )}
        </Box>
      </Box>
    )
  }

  let trackerContent

  if (trackerLoading) {
    trackerContent = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">Vérification de la santé des indexeurs...</Typography>
      </Box>
    )
  } else if (trackerError) {
    {
      if (trackerError === 'Not authenticated') {
        trackerContent = (
          <Typography variant="body2" color="error.main" sx={{ py: 1 }}>
            Vous n'êtes pas authentifié. Veuillez vous connecter pour vérifier la santé des trackers.
          </Typography>
        )
      } else {
        trackerContent = (
          <Typography variant="body2" color="error.main" sx={{ py: 1 }}>
            Impossible de vérifier la santé des trackers ({trackerError})
          </Typography>
        )
      }
    }

  } else if (trackerList.length === 0) {
    trackerContent = (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        Aucun tracker configuré.
      </Typography>
    )
  } else {
    trackerContent = (
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          mt: 1.5,
          mb: 2,
        }}
      >
        {trackerList.map((tracker) => {
          const isHealthy = tracker.isValid === true
          const label = `${tracker.name}`
          return (
            <Chip
              key={tracker.id ?? tracker.name}
              label={label}
              icon={isHealthy ? <CheckCircleIcon /> : <CancelIcon />}
              color={isHealthy ? 'success' : 'error'}
              variant={isHealthy ? 'filled' : 'outlined'}
              size="medium"
            />
          )
        })}
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" fontWeight="bold">
        Médias surveillés
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Liste des médias surveillés.
      </Typography>
      {trackerContent}
      {content}
    </Container>
  )
}
