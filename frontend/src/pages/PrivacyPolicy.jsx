import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'

export default function PrivacyPolicy() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
        Politique de confidentialité
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Protection et gestion des données personnelles sur le projet open source Dasharr.
      </Typography>

      <Card sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
            1. Projet open source & Autohébergement (Self-Hosting)
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Dasharr est un projet entièrement open source. <strong>Chacun est libre de déployer sa propre instance autonome</strong> sur son propre serveur ou machine locale.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Si vous hébergez votre propre instance, vous êtes le seul et unique maître de vos données, sans aucune télémétrie ni communication vers un serveur central.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
            2. Données collectées et finalités
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Nous limitons strictement la collecte aux informations techniques nécessaires à l'authentification et au fonctionnement de l'application (définie par vous même dans le .env de votre serveur) :
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Activité</strong></TableCell>
                  <TableCell><strong>Données collectées</strong></TableCell>
                  <TableCell><strong>Base légale</strong></TableCell>
                  <TableCell><strong>Durée de conservation</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Comptes utilisateurs</TableCell>
                  <TableCell>Nom / Pseudo, email, mot de passe (haché)</TableCell>
                  <TableCell>Accès au service</TableCell>
                  <TableCell>Jusqu'à suppression du compte</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
            3. Destinataires et partage des données
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Les données restent strictement cantonnées à la base de données de l'application. Aucune donnée n'est commercialisée, partagée ou transmise à des tiers ou régies publicitaires.
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
            4. Vos droits
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Vous disposez à tout moment d'un droit d'accès, de rectification et d'effacement intégral de vos données personnelles.
          </Typography>
          <Typography variant="body1">
            Pour demander la suppression de votre compte ou de vos données, envoyez simplement un email à : <strong>l'administrateur de l'instance que vous utilisez</strong>.
          </Typography>
        </Box>

      </Card>
    </Container>
  )
}
