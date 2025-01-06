import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { authService } from '../services/authService';

const SignIn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting sign in...');
      const response = await authService.passwordSignIn(formData);
      console.log('Sign in successful');
      
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        if (response.userInfo) {
          localStorage.setItem('userInfo', JSON.stringify(response.userInfo));
        }
        navigate('/dashboard');
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.response?.data?.detail || err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
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
          Sign In
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="userName"
            label="Email Address"
            name="userName"
            autoComplete="email"
            autoFocus
            value={formData.userName}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
          />

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/signup')}
            sx={{ mt: 1 }}
          >
            Don't have an account? Sign up
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default SignIn; 