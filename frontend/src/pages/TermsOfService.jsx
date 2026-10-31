import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'

export default function TermsOfService() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
        Conditions d'Utilisation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Dasharr — Projet open source & Autohébergement
      </Typography>

      <Card sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 1. Projet open source & Responsabilité de votre instance */}
        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
            1. Chacun est maître de son instance
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Dasharr est un projet logiciel open source mis à disposition gratuitement.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            <strong>Si vous déployez ou hébergez votre propre instance : vous en êtes l'unique administrateur et responsable.</strong> La gestion de vos serveurs, de vos sauvegardes, de la sécurité de vos accès, de vos configurations de téléchargement et des contenus que vous y associez relève exclusivement de votre responsabilité.
          </Typography>
        </Box>

        <Divider />

        {/* 2. Absence totale de garantie */}
        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
            2. Fourni « en l'état », sans garantie
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Le logiciel est fourni tel quel, sans garantie d'aucune sorte, expresse ou implicite. Le créateur/mainteneur du projet ne saurait en aucun cas être tenu responsable de :
          </Typography>
          <Typography variant="body1" component="div">
            <ul>
              <li>Tout bug, dysfonctionnement ou interruption de service.</li>
              <li>Toute perte, corruption de données ou mauvaise configuration sur votre infrastructure.</li>
              <li>L'usage que chaque utilisateur ou administrateur fait de son instance.</li>
            </ul>
          </Typography>
        </Box>

        <Divider />

        {/* 3. Contact */}
        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
            3. Contact
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pour toute question technique ou contribution au projet open source : <strong>thomas.constantin27@orange.fr</strong> ou directement via le dépôt GitHub.
          </Typography>
        </Box>
      </Card>
    </Container>
  )
}
