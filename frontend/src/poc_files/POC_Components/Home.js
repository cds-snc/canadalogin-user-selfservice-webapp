import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
} from '@mui/material';

const Home = () => {
  const navigate = useNavigate();

  const handlePasswordSignIn = () => {
    navigate('/signin/mfa');
  };

  const handlePasskeySignIn = () => {
    navigate('/signin/passkey');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Sign in with GC Sign in
        </Typography>
        
        <Paper
          elevation={3}
          sx={{
            mt: 4,
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              New User?
            </Typography>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate('/signup/mfa')}
              sx={{ mb: 2 }}
            >
              Sign Up with Password + MFA
            </Button>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate('/signup/passkey')}
              sx={{ mb: 1 }}
            >
              Sign Up with Passkey
            </Button>
            <Typography variant="body2" color="text.secondary">
              Choose your preferred sign-up method
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Existing User?
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handlePasswordSignIn}
              sx={{ mb: 2 }}
            >
              Sign In with Password + MFA
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handlePasskeySignIn}
              sx={{ mb: 1 }}
            >
              Sign In with Passkey
            </Button>
            <Typography variant="body2" color="text.secondary">
              Choose your preferred sign-in method
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Home; 