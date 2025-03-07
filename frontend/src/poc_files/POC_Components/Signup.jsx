import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Typography,
  Paper,
  Box,
  Grid,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import PasswordIcon from '@mui/icons-material/Password';
import SecurityIcon from '@mui/icons-material/Security';

const Signup = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h1" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        {t('auth.createAccount')}
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid #CCCCCC' }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <KeyIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            </Box>
            <Typography variant="h3" component="h2" gutterBottom align="center">
              {t('auth.passkey')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }} align="center">
              {t('auth.passkeyDescription')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="contained" onClick={() => navigate('/signup/passkey')}>
                {t('auth.registerWithPasskey')}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid #CCCCCC' }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <SecurityIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            </Box>
            <Typography variant="h3" component="h2" gutterBottom align="center">
              {t('auth.mfa')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }} align="center">
              {t('auth.mfaDescription')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="contained" onClick={() => navigate('/signup/mfa')}>
                {t('auth.registerWithMFA')}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid #CCCCCC' }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <PasswordIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            </Box>
            <Typography variant="h3" component="h2" gutterBottom align="center">
              {t('common.password')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }} align="center">
              {t('auth.passwordDescription')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="contained" onClick={() => navigate('/signup/password')}>
                {t('auth.registerWithPassword')}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('auth.haveAccount')} <Button variant="text" onClick={() => navigate('/login')}>{t('common.signIn')}</Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default Signup; 