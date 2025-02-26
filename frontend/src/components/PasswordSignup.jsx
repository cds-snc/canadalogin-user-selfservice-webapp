import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  TextField,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import PasswordIcon from '@mui/icons-material/Password';
import { authService } from '../services/authService';

const PasswordSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const userData = {
        userName: formData.email,
        password: formData.password,
        name: {
          givenName: formData.firstName,
          familyName: formData.lastName,
        }
      };

      await authService.signup(userData);
      navigate('/login');
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.response?.data?.detail || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 'sm', mx: 'auto' }}>
      <Typography variant="h1" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Register with Password
      </Typography>

      <Paper elevation={0} sx={{ p: 4, border: '1px solid #CCCCCC' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <PasswordIcon sx={{ fontSize: 64, color: 'primary.main' }} />
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              inputProps={{
                minLength: 8,
                pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
              }}
              helperText="Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              size="large"
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate('/signup')}
              size="large"
              fullWidth
            >
              Back to Registration Options
            </Button>
          </Box>
        </form>
      </Paper>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account? <Button variant="text" onClick={() => navigate('/login')}>Sign in with Password</Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default PasswordSignup; 