import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

export default function Home() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
        Accueil
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Bienvenue sur votre nouveau projet Dasharr !
      </Typography>
    </Container>
  )
}
