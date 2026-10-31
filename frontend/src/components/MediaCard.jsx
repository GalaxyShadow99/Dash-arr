import { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import CircularProgress from '@mui/material/CircularProgress'
import FavoriteIcon from '@mui/icons-material/Favorite';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded'

import { addMovie, addSeries, checkReleases, deleteMedia } from '../services/radarr'

export default function MediaCard({
  mediaType = 'movie',
  movieId,
  seriesId,
  tmdbId,
  tvdbId,
  title,
  overview,
  imageUrl,
  hasFile: _hasFile,
  imdbId,
  fetchReleases = true,
  addToWishlistButton = false,
  deleteFromWishlistButton = false,
  onDelete,
}) {
  const [checkingTrackers, setCheckingTrackers] = useState(false)
  const [releaseInfo, setReleaseInfo] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false)
  const [modalDeleteState, setModalDeleteState] = useState({ error: null })
  const [modalOpen, setModalOpen] = useState(false)
  const [modalState, setModalState] = useState({ success: true, message: '' })

  const handleOpenAddModal = async () => {
    if (!tmdbId && !tvdbId) return
    try {
      setIsAdding(true)
      if (mediaType === 'series') {
        const targetTvdbId = tvdbId ?? tmdbId
        await addSeries(Number(targetTvdbId))
        setIsAdded(true)
        setModalState({
          success: true,
          message: `"${title}" a été ajouté avec succès à votre bibliothèque Sonarr !`,
        })
      } else {
        await addMovie(Number(tmdbId))
        setIsAdded(true)
        setModalState({
          success: true,
          message: `"${title}" a été ajouté avec succès à votre bibliothèque Radarr !`,
        })
      }
      setModalOpen(true)
    } catch (err) {
      console.error("Erreur lors de l'ajout du média :", err)
      setModalState({
        success: false,
        message: err.message || `Impossible d'ajouter "${title}".`,
      })
      setModalOpen(true)
    } finally {
      setIsAdding(false)
    }
  }

  const handleOpenDeleteModal = () => {
    setModalDeleteOpen(true)
  }

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setModalDeleteOpen(false)
      setModalDeleteState({ error: null })
    }
  }

  const handleConfirmDelete = async () => {
    const targetId = movieId ?? seriesId
    if (!targetId) return
    try {
      setIsDeleting(true)
      await deleteMedia({ mediaType, id: targetId })
      setModalDeleteOpen(false)
      if (onDelete) {
        onDelete(targetId)
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du média :', err)
      setModalDeleteState({
        error: err.message || `Impossible de supprimer "${title}".`,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
  }

  useEffect(() => {
    let isCancelled = false

    async function fetchReleaseInfo() {
      try {
        setCheckingTrackers(true)
        const data = await checkReleases({
          mediaType,
          movieId,
          seriesId,
          tmdbId,
          tvdbId,
        })
        if (!isCancelled) {
          setReleaseInfo(data)
        }
      } catch (err) {
        console.error('Erreur vérification trackers :', err)
        if (!isCancelled) {
          setReleaseInfo({ hasReleases: false, error: true })
        }
      } finally {
        if (!isCancelled) {
          setCheckingTrackers(false)
        }
      }
    }

    if (fetchReleases) {
      fetchReleaseInfo()
    }

    return () => {
      isCancelled = true
    }
  }, [mediaType, movieId, seriesId, tmdbId, tvdbId, fetchReleases])
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 3,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      {imageUrl ? (
        <CardMedia
          component="img"
          height="380"
          image={imageUrl}
          alt={title}
          sx={{ objectFit: 'cover' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <Box
          sx={{
            height: 220,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            color: 'text.secondary',
            gap: 1,
          }}
        >
          <Typography variant="body2">{mediaType === 'series' ? '📺 Aucune affiche' : '🎬 Aucune affiche'}</Typography>
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1, gap: 1 }}>
          <Typography variant="h6" component="h2" fontWeight="bold">
            {title}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
            {checkingTrackers && !releaseInfo && (
              <Chip
                icon={<CircularProgress size={12} color="inherit" />}
                label="Trackers..."
                size="small"
                variant="outlined"
              />
            )}
            {releaseInfo && !releaseInfo.error && (
              <Chip
                icon={releaseInfo.hasReleases ? <CheckCircleIcon /> : <CancelIcon />}
                label={
                  releaseInfo.hasReleases
                    ? `${releaseInfo.activeReleasesCount} release(s)`
                    : 'Introuvable sur trackers'
                }
                color={releaseInfo.hasReleases ? 'success' : 'error'}
                size="small"
              />
            )}
            {releaseInfo?.error && (
              <Chip
                label="Erreur trackers"
                color="warning"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {overview || 'Aucune description disponible.'}
        </Typography>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        {(() => {
          let externalUrl = null
          let externalLabel = 'Fiche'

          if (mediaType === 'series') {
            if (tvdbId) {
              externalUrl = `https://thetvdb.com/dereferrer/series/${tvdbId}`
              externalLabel = 'Page TVDB'
            } else if (imdbId) {
              externalUrl = `https://www.imdb.com/title/${imdbId}`
              externalLabel = 'Page IMDb'
            }
          } else {
            if (imdbId) {
              externalUrl = `https://www.imdb.com/title/${imdbId}`
              externalLabel = 'Page IMDb'
            } else if (tmdbId) {
              externalUrl = `https://www.themoviedb.org/movie/${tmdbId}`
              externalLabel = 'Page TMDB'
            }
          }

          return (
            <Button
              component={Link}
              href={externalUrl || '#'}
              target="_blank"
              endIcon={<OpenInNewIcon />}
              size="small"
              disabled={!externalUrl}
            >
              {externalLabel}
            </Button>
          )
        })()}

        {addToWishlistButton && (
          <Button
            onClick={handleOpenAddModal}
            variant="contained"
            color={isAdded ? 'success' : 'primary'}
            endIcon={
              isAdding ? (
                <CircularProgress size={16} color="inherit" />
              ) : isAdded ? (
                <BookmarkAddedIcon />
              ) : (
                <FavoriteIcon />
              )
            }
            size="small"
            disabled={!tmdbId || isAdding || isAdded}
          >
            {isAdding ? 'Ajout...' : isAdded ? 'Dans Radarr' : 'Ajouter à la liste'}
          </Button>
        )}

        {deleteFromWishlistButton && (
          <Button
            onClick={handleOpenDeleteModal}
            variant="outlined"
            color="error"
            endIcon={<DeleteOutlinedIcon />}
            size="small"
            disabled={!(movieId || seriesId)}
          >
            Supprimer
          </Button>
        )}
      </CardActions>

      {/* Modal de confirmation de suppression */}
      <Dialog
        open={modalDeleteOpen}
        onClose={handleCloseDeleteModal}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 1.5,
              minWidth: 320,
              maxWidth: 440,
              boxShadow: 8,
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <ErrorOutlinedIcon color="error" sx={{ fontSize: 32 }} />
          <Typography variant="h6" component="div" fontWeight="bold">
            {mediaType === 'series' ? 'Supprimer cette série ?' : 'Supprimer ce film ?'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body1" color="text.secondary">
            Voulez-vous vraiment retirer <strong>« {title} »</strong> de votre bibliothèque {mediaType === 'series' ? 'Sonarr' : 'Radarr'} ?
          </Typography>
          {modalDeleteState.error && (
            <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
              {modalDeleteState.error}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ pt: 2, px: 2, gap: 1 }}>
          <Button
            onClick={handleCloseDeleteModal}
            variant="outlined"
            color="inherit"
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={isDeleting}
            startIcon={
              isDeleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteOutlinedIcon />
              )
            }
            autoFocus
          >
            {isDeleting ? 'Suppression...' : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal stylisé avec MUI Dialog */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          {modalState.success ? (
            <CheckCircleOutlinedIcon color="success" sx={{ fontSize: 32 }} />
          ) : (
            <ErrorOutlinedIcon color="error" sx={{ fontSize: 32 }} />
          )}
          <Typography variant="h6" component="div" fontWeight="bold">
            {modalState.success
              ? (mediaType === 'series' ? 'Série ajoutée !' : 'Film ajouté !')
              : 'Erreur d’ajout'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body1" color="text.secondary">
            {modalState.message}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ pt: 2, px: 2 }}>
          <Button
            onClick={handleCloseModal}
            variant={modalState.success ? 'contained' : 'outlined'}
            color={modalState.success ? 'primary' : 'inherit'}
            autoFocus
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

    </Card>
  )
}
