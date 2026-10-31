import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

import { AppTheme } from './theme/theme'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import About from './pages/About'
import MonitoredMedias from './pages/MonitoredMedias'
import CreateMedia from './pages/CreateMedia'
import Login from './pages/Login'
import LegalNotices from './pages/LegalNotices'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'

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
          <Box component="main" sx={{ flexGrow: 1, pt: 12, pb: 8 }}>
            <Routes>
              <Route path="/" element={<MonitoredMedias />} />
              <Route path="/about" element={<About />} />
              <Route path="/monitored-medias" element={<MonitoredMedias />} />
              <Route path="/create-media" element={<CreateMedia />} />
              <Route path="/login" element={<Login />} />
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
          </Box>

          <Footer />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  )
}
