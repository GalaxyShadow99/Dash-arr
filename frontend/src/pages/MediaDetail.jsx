import { useEffect, useState } from 'react'
import { useSearchParams, Link as RouterLink } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import StarIcon from '@mui/icons-material/Star'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import MovieIcon from '@mui/icons-material/Movie'
import LiveTvIcon from '@mui/icons-material/LiveTv'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import YouTubeIcon from '@mui/icons-material/YouTube'
import DownloadIcon from '@mui/icons-material/Download'
import LanguageIcon from '@mui/icons-material/Language'
import FolderIcon from '@mui/icons-material/Folder'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

import { fetchMovieDetails, fetchSeriesDetails, fetchMovieReleases, fetchSeriesReleases, checkReleases } from '../services/radarr'

export default function MediaDetail() {
  const [datas, setDatas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // États pour les releases
  const [releases, setReleases] = useState([])
  const [loadingReleases, setLoadingReleases] = useState(false)
  const [releasesLoaded, setReleasesLoaded] = useState(false)
  const [releaseError, setReleaseError] = useState(null)

  // Vérification trackers pour la pill
  const [releaseInfo, setReleaseInfo] = useState(null)
  const [checkingTrackers, setCheckingTrackers] = useState(false)

  const [searchParams] = useSearchParams()
  const mediaType = searchParams.get('mediaType')
  const movieId = searchParams.get('movieId')
  const seriesId = searchParams.get('seriesId')

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        if (mediaType === 'movie' && movieId) {
          const dat = await fetchMovieDetails(movieId)
          setDatas(dat)
        } else if (mediaType === 'series' && seriesId) {
          const dat = await fetchSeriesDetails(seriesId)
          setDatas(dat)
        }
      } catch (err) {
        console.error('Erreur lors du chargement des details :', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [mediaType, movieId, seriesId])

  useEffect(() => {
    let isCancelled = false
    async function verifyTrackers() {
      if (!datas) return
      try {
        setCheckingTrackers(true)
        const info = await checkReleases({
          mediaType: mediaType || 'movie',
          movieId: movieId ? Number(movieId) : (datas.id ?? undefined),
          seriesId: seriesId ? Number(seriesId) : (datas.id ?? undefined),
          tmdbId: datas.tmdbId,
          tvdbId: datas.tvdbId,
        })
        if (!isCancelled) {
          setReleaseInfo(info)
        }
      } catch (err) {
        console.error('Erreur vérification trackers :', err)
      } finally {
        if (!isCancelled) {
          setCheckingTrackers(false)
        }
      }
    }

    verifyTrackers()
    return () => {
      isCancelled = true
    }
  }, [datas, mediaType, movieId, seriesId])

  // Chargement à la demande des releases
  const handleLoadReleases = async () => {
    try {
      setLoadingReleases(true)
      setReleaseError(null)
      let results = []
      if (mediaType === 'movie' && movieId) {
        results = await fetchMovieReleases(movieId)
      } else if (mediaType === 'series' && seriesId) {
        // Pour une série, itérer sur toutes les saisons (hors spéciaux / saison 0 si vide)
        const validSeasons = (datas?.seasons || [])
          .map((s) => s.seasonNumber)
          .filter((sNum) => sNum > 0)

        if (validSeasons.length > 0) {
          const seasonPromises = validSeasons.map((sNum) =>
            fetchSeriesReleases(seriesId, sNum).catch((err) => {
              console.warn(`Erreur releases saison ${sNum}:`, err)
              return []
            })
          )
          const seasonsResults = await Promise.all(seasonPromises)
          // Dédupliquer par guid ou title
          const seen = new Set()
          for (const list of seasonsResults) {
            for (const item of list) {
              const key = item.guid || item.title
              if (!seen.has(key)) {
                seen.add(key)
                results.push(item)
              }
            }
          }
        } else {
          results = await fetchSeriesReleases(seriesId)
        }
      }
      // Trier les releases : d'abord les conformes (approved: true), puis par seeders décroissants
      const sortedResults = [...results].sort((a, b) => {
        if (Boolean(a.approved) !== Boolean(b.approved)) {
          return Number(b.approved) - Number(a.approved);
        }
        return (b.seeders ?? 0) - (a.seeders ?? 0);
      });
      setReleases(sortedResults);
      setReleasesLoaded(true)
    } catch (err) {
      console.error('Erreur lors de la récupération des releases :', err)
      setReleaseError(err.message)
    } finally {
      setLoadingReleases(false)
    }
  }

  if (loading) {
    return (
      <Container sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={45} />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Chargement de la fiche du média...
        </Typography>
      </Container>
    )
  }

  if (error || !datas) {
    return (
      <Container sx={{ py: 6 }}>
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
          Retour aux médias
        </Button>
        <Card sx={{ p: 4, textAlign: 'center', borderColor: 'error.main', border: '1px solid' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Impossible de charger le média
          </Typography>
          <Typography color="text.secondary">{error || 'Média introuvable'}</Typography>
        </Card>
      </Container>
    )
  }

  const posterUrl =
    datas.images?.find((img) => img.coverType === 'poster')?.remoteUrl ??
    datas.images?.find((img) => img.coverType === 'poster')?.url ??
    datas.images?.[0]?.remoteUrl

  const fanartUrl =
    datas.images?.find((img) => img.coverType === 'fanart')?.remoteUrl ??
    datas.images?.find((img) => img.coverType === 'fanart')?.url

  const imdbRating = datas.ratings?.imdb?.value
  const tmdbRating = datas.ratings?.tmdb?.value ?? datas.ratings?.value
  const ratingVotes = datas.ratings?.imdb?.votes ?? datas.ratings?.votes

  const hasDownloadedFile = datas.hasFile ?? (datas.statistics?.episodeFileCount > 0)
  const sizeGb = datas.sizeOnDisk
    ? (datas.sizeOnDisk / (1024 * 1024 * 1024)).toFixed(2)
    : datas.statistics?.sizeOnDisk
      ? (datas.statistics.sizeOnDisk / (1024 * 1024 * 1024)).toFixed(2)
      : 0

  const runtimeFormatted = datas.runtime
    ? `${Math.floor(datas.runtime / 60)}h ${datas.runtime % 60}m`
    : null

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Go'
    const gb = bytes / (1024 * 1024 * 1024)
    if (gb >= 1) return `${gb.toFixed(2)} Go`
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(0)} Mo`
  }

  return (
    <Box sx={{ width: '100%', pb: 8, mt: 0 }}>
      {/* Bannière Fanart immersive */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          minHeight: { xs: 300, md: 420 },
          backgroundImage: fanartUrl ? `url(${fanartUrl})` : 'none',
          backgroundColor: '#0b1320',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          display: 'flex',
          alignItems: 'flex-end',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #090e17 0%, rgba(9, 14, 23, 0.75) 55%, rgba(9, 14, 23, 0.45) 100%)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 3 }}>
          <Button
            component={RouterLink}
            to="/"
            startIcon={<ArrowBackIcon />}
            sx={{
              color: '#fff',
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              mb: 2,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            }}
          >
            Retour aux médias
          </Button>
        </Container>
      </Box>

      {/* Contenu principal */}
      <Container maxWidth="lg" sx={{ mt: { xs: -12, md: -16 }, position: 'relative', zIndex: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          {/* Colonne Gauche : Affiche / Stockage */}
          <Box sx={{ width: { xs: '100%', md: 280, lg: 320 }, flexShrink: 0, mx: { xs: 'auto', md: 0 } }}>
            <Card
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: 8,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {posterUrl ? (
                <Box
                  component="img"
                  src={posterUrl}
                  alt={datas.title}
                  sx={{ width: '100%', height: 'auto', display: 'block' }}
                />
              ) : (
                <Box
                  sx={{
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <MovieIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
                </Box>
              )}
            </Card>

            <Card sx={{ mt: 3, p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ETAT SUR LE DISQUE
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Disponibilité trackers :</Typography>
                  {checkingTrackers && !releaseInfo && (
                    <Chip
                      icon={<CircularProgress size={12} color="inherit" />}
                      label="Recherche..."
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {releaseInfo && !releaseInfo.error && (
                    <Chip
                      icon={releaseInfo.hasReleases ? <CheckCircleIcon /> : <CancelIcon />}
                      label={releaseInfo.hasReleases ? 'Disponible' : 'Introuvable'}
                      color={releaseInfo.hasReleases ? 'success' : 'error'}
                      size="small"
                    />
                  )}
                  {releaseInfo?.error && (
                    <Chip label="Erreur trackers" color="warning" size="small" variant="outlined" />
                  )}
                  {!checkingTrackers && !releaseInfo && (
                    <Chip label="Non vérifié" size="small" variant="outlined" />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Fichier sur disque :</Typography>
                  {hasDownloadedFile ? (
                    <Chip size="small" icon={<CheckCircleOutlinedIcon />} label="Téléchargé" color="success" />
                  ) : (
                    <Chip size="small" icon={<CancelOutlinedIcon />} label="Manquant" color="warning" />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Taille :</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {sizeGb > 0 ? `${sizeGb} Go` : '0 Go'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Suivi :</Typography>
                  <Chip
                    size="small"
                    label={datas.monitored ? 'Oui' : 'Non'}
                    color={datas.monitored ? 'primary' : 'default'}
                  />
                </Box>

                {datas.path && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FolderIcon sx={{ fontSize: 16 }} /> Dossier :
                    </Typography>
                    <Typography variant="caption" sx={{ wordBreak: 'break-all', display: 'block', mt: 0.3 }}>
                      {datas.path}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Card>
          </Box>

          {/* Colonne Droite : Métadonnées, Synopsis, Releases */}
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Typography variant="h3" component="h1" fontWeight="bold">
                  {datas.title}
                </Typography>
                {datas.year && (
                  <Typography variant="h4" color="text.secondary">
                    ({datas.year})
                  </Typography>
                )}
              </Box>

              {datas.originalTitle && datas.originalTitle !== datas.title && (
                <Typography variant="subtitle1" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1.5 }}>
                  Titre original : {datas.originalTitle}
                </Typography>
              )}

              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ alignItems: 'center', mb: 2 }}>
                <Chip
                  icon={mediaType === 'series' ? <LiveTvIcon /> : <MovieIcon />}
                  label={mediaType === 'series' ? 'Série TV' : 'Film'}
                  color="primary"
                />
                {mediaType === 'series' ? (
                  <>
                    {datas.status && (
                      <Chip
                        label={
                          datas.status === 'ended'
                            ? 'Terminée'
                            : datas.status === 'continuing'
                              ? 'En cours'
                              : datas.status.toUpperCase()
                        }
                        color={datas.status === 'ended' ? 'default' : 'info'}
                        variant="outlined"
                      />
                    )}
                    {datas.firstAired && (
                      <Chip
                        label={`1ère diff. : ${new Date(datas.firstAired).toLocaleDateString()}`}
                        variant="outlined"
                      />
                    )}
                    {datas.network && (
                      <Chip label={datas.network} variant="outlined" />
                    )}
                  </>
                ) : (
                  <>
                    {datas.status === 'released' && datas.releaseDate && (
                      <Chip label={`Sorti le ${new Date(datas.releaseDate).toLocaleDateString()}`} variant="outlined" />
                    )}
                    {datas.status && datas.status !== 'released' && (
                      <Chip label={datas.status.toUpperCase()} color="info" variant="outlined" />
                    )}
                  </>
                )}

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
                    label={releaseInfo.hasReleases ? 'Disponible' : 'Introuvable'}
                    color={releaseInfo.hasReleases ? 'success' : 'error'}
                  />
                )}
                {releaseInfo?.error && (
                  <Chip label="Erreur trackers" color="warning" variant="outlined" />
                )}



                {datas.certification && <Chip label={datas.certification} variant="outlined" />}
                {runtimeFormatted && <Chip icon={<AccessTimeIcon />} label={runtimeFormatted} variant="outlined" />}

                {(imdbRating || tmdbRating) && (
                  <Chip
                    icon={<StarIcon sx={{ color: '#fbbf24 !important' }} />}
                    label={`${imdbRating || tmdbRating} / 10 ${ratingVotes ? `(${ratingVotes.toLocaleString()} avis)` : ''}`}
                    sx={{ borderColor: '#fbbf24', border: '1px solid' }}
                  />
                )}
              </Stack>

              {datas.genres?.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                  {datas.genres.map((genre) => (
                    <Chip key={genre} label={genre} size="small" variant="filled" />
                  ))}
                </Stack>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Synopsis */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Synopsis
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: '1.05rem' }}>
                {datas.overview || 'Aucun résumé disponible pour ce média.'}
              </Typography>
            </Box>

            {/* SECTION RELEASES DISPONIBLES */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Releases & Torrents ({releasesLoaded ? releases.length : '?'})
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loadingReleases ? <CircularProgress size={18} color="inherit" /> : <CloudDownloadIcon />}
                  onClick={handleLoadReleases}
                  disabled={loadingReleases}
                >
                  {loadingReleases ? 'Recherche...' : releasesLoaded ? 'Actualiser les releases' : 'Chercher les releases'}
                </Button>
              </Box>

              {releaseError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {releaseError}
                </Alert>
              )}

              {releasesLoaded && releases.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Aucune release trouvée sur vos indexers pour ce titre.
                </Alert>
              )}

              {/* Liste déroulante des releases */}
              {releases.map((rel, idx) => {
                const isApproved = rel.approved === true
                const qualName = rel.quality?.quality?.name || 'Inconnue'
                const res = rel.quality?.quality?.resolution ? `${rel.quality.quality.resolution}p` : ''
                const tracker = rel.indexer || 'Tracker'
                const lang = rel.languages?.map((l) => l.name).join(', ') || 'Multi'

                return (
                  <Accordion
                    key={rel.guid || idx}
                    sx={{
                      mb: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: isApproved ? 'rgba(74, 222, 128, 0.3)' : 'divider',
                      backgroundColor: isApproved ? 'rgba(34, 197, 94, 0.04)' : 'background.paper',
                      '&::before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1.5, flexWrap: 'wrap', pr: 1 }}>
                        {/* Statut Accepté / Refusé */}
                        <Chip
                          size="small"
                          label={isApproved ? 'Conforme' : 'Rejeté'}
                          color={isApproved ? 'success' : 'default'}
                          variant={isApproved ? 'filled' : 'outlined'}
                        />

                        {/* Qualité */}
                        <Chip
                          size="small"
                          label={res ? `${qualName}` : qualName}
                          color="info"
                          variant="filled"
                        />

                        {/* Tracker */}
                        <Chip size="small" label={tracker} variant="outlined" />

                        {/* Taille */}
                        <Typography variant="body2" fontWeight="bold">
                          {formatBytes(rel.size)}
                        </Typography>

                        {/* Seeders / Leechers */}
                        {rel.seeders !== undefined && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                            <Typography variant="caption" sx={{ color: 'success.main', display: 'flex', alignItems: 'center' }}>
                              <ArrowUpwardIcon sx={{ fontSize: 14 }} /> {rel.seeders}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                              <ArrowDownwardIcon sx={{ fontSize: 14 }} /> {rel.leechers ?? 0}
                            </Typography>
                            {rel.downloadUrl && (
                              <Tooltip title="Télécharger le fichier torrent / .torrent" arrow>
                                <Button
                                  component="a"
                                  href={rel.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Download
                                </Button>
                              </Tooltip>
                            )}
                          </Box>
                        )}
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                      <Divider sx={{ mb: 2 }} />

                      {/* Nom complet de la release */}
                      <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', mb: 1.5, backgroundColor: 'rgba(0,0,0,0.2)', p: 1, borderRadius: 1 }}>
                        {rel.title}
                      </Typography>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Langue :</strong> {lang}
                        </Typography>
                        {rel.releaseGroup && (
                          <Typography variant="caption" color="text.secondary">
                            <strong>Groupe :</strong> {rel.releaseGroup}
                          </Typography>
                        )}
                        {rel.protocol && (
                          <Typography variant="caption" color="text.secondary">
                            <strong>Protocole :</strong> {rel.protocol.toUpperCase()}
                          </Typography>
                        )}
                      </Box>

                      {/* Motifs de rejets éventuels */}
                      {rel.rejections?.length > 0 && (
                        <Box sx={{ mt: 1.5, p: 1, borderRadius: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          <Typography variant="caption" color="error" fontWeight="bold">
                            Motifs de rejet par votre profil Radarr/Sonarr :
                          </Typography>
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                            {rel.rejections.map((rej, i) => (
                              <li key={i}>
                                <Typography variant="caption" color="text.secondary">
                                  {rej}
                                </Typography>
                              </li>
                            ))}
                          </ul>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )
              })}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Saisons pour les séries */}
            {mediaType === 'series' && datas.seasons?.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Saisons ({datas.seasons.length})
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 2,
                    mt: 1.5,
                  }}
                >
                  {datas.seasons.map((season) => (
                    <Card key={season.seasonNumber} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {season.seasonNumber === 0 ? 'Specials' : `Saison ${season.seasonNumber}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {season.statistics?.episodeFileCount ?? 0} / {season.statistics?.totalEpisodeCount ?? 0} épisodes
                      </Typography>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            {/* Liens externes et IDs */}
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Informations & Liens
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {datas.youTubeTrailerId && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<YouTubeIcon />}
                    href={`https://www.youtube.com/watch?v=${datas.youTubeTrailerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Bande-annonce YouTube
                  </Button>
                )}

                {datas.website && (
                  <Button
                    variant="outlined"
                    startIcon={<LanguageIcon />}
                    href={datas.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Site Officiel
                  </Button>
                )}

                {datas.imdbId && (
                  <Button
                    variant="outlined"
                    href={`https://www.imdb.com/title/${datas.imdbId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    IMDb ({datas.imdbId})
                  </Button>
                )}

                {mediaType === 'series' ? (
                  <>
                    {datas.tvdbId && (
                      <Button
                        variant="outlined"
                        href={`https://thetvdb.com/dereferrer/series/${datas.tvdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        TheTVDB ({datas.tvdbId})
                      </Button>
                    )}
                    {datas.tmdbId && (
                      <Button
                        variant="outlined"
                        href={`https://www.themoviedb.org/tv/${datas.tmdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        TMDB ({datas.tmdbId})
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {datas.tmdbId && (
                      <Button
                        variant="outlined"
                        href={`https://www.themoviedb.org/movie/${datas.tmdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        TMDB ({datas.tmdbId})
                      </Button>
                    )}
                  </>
                )}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
