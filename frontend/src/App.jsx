import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import { AppTheme } from './theme/theme'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MonitoredMedias from './pages/MonitoredMedias'

// Chargement a la demande (code-splitting via dynamic import)
const About = lazy(() => import('./pages/About'))
const CreateMedia = lazy(() => import('./pages/CreateMedia'))
const Login = lazy(() => import('./pages/Login'))
const MediaDetail = lazy(() => import('./pages/MediaDetail'))
const LegalNotices = lazy(() => import('./pages/LegalNotices'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))

export default function App() {
  return (
    <ThemeProvider theme={AppTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <Navbar />

          {/* Contenu principal prenant tout l'espace disponible avec marge de sécurité */}
          <Box component="main" sx={{ flexGrow: 1, pb: 8 }}>
            <Suspense
              fallback={
                <Container sx={{ py: 10, textAlign: 'center' }}>
                  <CircularProgress size={40} />
                </Container>
              }
            >
              <Routes>
                <Route path="/" element={<MonitoredMedias />} />
                <Route path="/about" element={<About />} />
                <Route path="/monitored-medias" element={<MonitoredMedias />} />
                <Route path="/create-media" element={<CreateMedia />} />
                <Route path="/login" element={<Login />} />
                <Route path="/media-detail" element={<MediaDetail />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/politique-confidentialite" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/cgu" element={<TermsOfService />} />
                <Route path="/legal" element={<LegalNotices />} />
                <Route path="/mentions-legales" element={<LegalNotices />} />
                <Route
                  path="*"
                  element={
                    <Container sx={{ py: 6, textAlign: 'center' }}>
                      <Typography variant="h4">404 - Page non trouvée</Typography>
                    </Container>
                  }
                />
              </Routes>
            </Suspense>
          </Box>

          <Footer />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  )
}
