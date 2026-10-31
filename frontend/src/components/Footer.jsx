import * as React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

// --- Configuration des variables modifiables facilement (ou via .env) ---
const AUTHOR_NAME = import.meta.env.VITE_FOOTER_AUTHOR ?? 'Thomas .C';
const AUTHOR_LINK = import.meta.env.VITE_FOOTER_AUTHOR_URL ?? 'https://github.com/GalaxyShadow99/';
const COPYRIGHT_YEAR = import.meta.env.VITE_FOOTER_YEAR ?? new Date().getFullYear();
const GITHUB_URL = import.meta.env.VITE_FOOTER_GITHUB_URL ?? 'https://github.com/GalaxyShadow99/';
const LINKEDIN_URL = import.meta.env.VITE_FOOTER_LINKEDIN_URL ?? 'https://fr.linkedin.com/in/thomas-constantin-346224397';

function Copyright() {
  return (
    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
      {'Copyright © '}
      <Link
        href={AUTHOR_LINK}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          color: 'text.secondary',
        }}
      >
        {AUTHOR_NAME}
      </Link>
      &nbsp;
      {COPYRIGHT_YEAR}
    </Typography>
  );
}

function Footer() {
  return (
    <React.Fragment>
      <Divider />
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: { xs: 4, sm: 6 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          <div>
            <Link
              component={RouterLink}
              to="/legal"
              variant="body2"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Mentions légales
            </Link>
            <Typography sx={{ display: 'inline', mx: 0.8, opacity: 0.5 }}>
              •
            </Typography>
            <Link
              component={RouterLink}
              to="/privacy"
              variant="body2"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Confidentialité
            </Link>
            <Typography sx={{ display: 'inline', mx: 0.8, opacity: 0.5 }}>
              •
            </Typography>
            <Link
              component={RouterLink}
              to="/terms"
              variant="body2"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              CGU
            </Link>
            <Copyright />
          </div>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ justifyContent: 'left', color: 'text.secondary' }}
          >
            <IconButton
              color="inherit"
              size="small"
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              sx={{ alignSelf: 'center' }}
            >
              <GitHubIcon />
            </IconButton>
            <IconButton
              color="inherit"
              size="small"
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              sx={{ alignSelf: 'center' }}
            >
              <LinkedInIcon />
            </IconButton>
          </Stack>
        </Box>
      </Container>
    </React.Fragment>
  );
}

export default Footer;