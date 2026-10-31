import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'

export default function LegalNotices() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
        Mentions légales
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Informations légales relatives au projet Dasharr.
      </Typography>

      <Card sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
            1. Présentation du projet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            L'application accessible à l'adresse <strong>{window.location.href}</strong> est un projet personnel open source à vocation non commerciale, développé et maintenu par :
          </Typography>
          <Typography variant="body1" component="div">
            <ul>
              <li><strong>Auteur / Mainteneur :</strong> Thomas .C</li>
              <li><strong>Contact :</strong> thomas.constantin27@orange.fr</li>
              <li><strong>Dépôt & Code source :</strong> <a href="https://github.com/GalaxyShadow/dasharr" target="_blank" rel="noopener noreferrer">Accessible publiquement sur GitHub</a></li>
            </ul>
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
            2. Hébergement
          </Typography>
          <Typography variant="body1" color="text.secondary">
            L'instance de démonstration et les services associés sont hébergés sur une infrastructure privée autohébergée (Self-Hosted), administrée directement par le mainteneur du projet.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
            3. Propriété intellectuelle & Licence
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Le code source de l'application est mis à disposition sous licence libre/open source. Vous êtes libre de l'utiliser, l'étudier, le modifier et le déployer sur vos propres environnements selon les termes de sa licence.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Les marques, visuels, affiches et métadonnées tiers (notamment issus de TheMovieDatabase - TMDB et TheTVDB) restent la propriété exclusive de leurs détenteurs respectifs.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
            4. Limitation de responsabilité
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Ce projet est fourni gratuitement, à des fins éducatives et d'organisation personnelle, « en l'état » et sans garantie d'aucune sorte.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Le mainteneur décline toute responsabilité en cas d'interruption du service, d'incompatibilité avec des services tiers ou de perte fortuite de données.
          </Typography>
        </Box>
      </Card>
    </Container>
  )
}
