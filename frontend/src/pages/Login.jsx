import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/auth';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: '0 auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: 'auto',
  padding: theme.spacing(2),
  paddingTop: 0,
  paddingBottom: 0,
  marginBottom: 0,
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 0,
  },
}));

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    if (!email || !password) {
      setServerError('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    try {
      setLoading(true);
      await loginUser(email, password);
      // Redirection immédiate vers les médias surveillés
      console.log('Connexion réussie');
      navigate('/monitored-medias');
    } catch (err) {
      setServerError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInContainer direction="column">
      <Card variant="outlined">
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', fontWeight: 'bold' }}
        >
          Connexion
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ my: 1 }}>
            {serverError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 2,
          }}
        >
          <FormControl>
            <FormLabel htmlFor="email">Email</FormLabel>
            <TextField
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              autoFocus
              required
              fullWidth
              variant="outlined"
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="password">Mot de passe</FormLabel>
            <TextField
              name="password"
              placeholder="••••••"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              fullWidth
              variant="outlined"
            />
          </FormControl>
          <FormControlLabel
            control={<Checkbox defaultChecked color="primary" />}
            label="Se souvenir de moi"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
          <Link
            component="button"
            type="button"
            variant="body2"
            sx={{ alignSelf: 'center' }}
            onClick={() => alert("Les identitifants sont situés dans le fichier .env sur votre serveur.")}
          >
            Mot de passe oublié ?
          </Link>
        </Box>
      </Card>
    </SignInContainer>
  );
}

export default Login;
