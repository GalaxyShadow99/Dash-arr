import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

export default function About() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
        À propos
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Page de présentation de l'application Dasharr.
      </Typography>
    </Container>
  )
}
