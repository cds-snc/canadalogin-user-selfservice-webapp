import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Typography,
  Paper,
  Box,
  TextField,
  Divider,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const Home = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    console.log('Current language:', i18n.language);
    console.log('Available languages:', i18n.languages);
    console.log('Translation test:', t('home.title'));
    console.log('Translation resources:', i18n.store.data);
  }, [i18n.language, t]);

  return (
    <Box sx={{ maxWidth: 'md', mx: 'auto', mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" component="h1" 
          sx={{ 
            fontSize: '2rem', 
            fontWeight: 600,
            color: '#333',
            mb: 2 
          }}>
          {t('auth.signInWithGCKey')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t('auth.continueToService', { service: 'Canadian Dental Care Plan application' })}
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 4, border: '1px solid #ccc', mb: 4 }}>
        <Box component="form" sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
            {t('common.emailAddress')}
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            size="medium"
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            fullWidth
            sx={{
              bgcolor: '#26374A',
              color: 'white',
              '&:hover': {
                bgcolor: '#1C578A'
              },
              py: 1.5
            }}
          >
            {t('common.continue')}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
          <Divider sx={{ flex: 1 }} />
          <Typography variant="body1" sx={{ mx: 2 }}>
            {t('common.or')}
          </Typography>
          <Divider sx={{ flex: 1 }} />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<KeyIcon />}
            sx={{
              bgcolor: '#F8C05C',
              color: '#000',
              '&:hover': {
                bgcolor: '#E6B04D'
              }
            }}
            onClick={() => navigate('/signin/passkey')}
          >
            {t('auth.continueWithPasskey')}
          </Button>

          <Button
            variant="contained"
            startIcon={<AccountBalanceIcon />}
            sx={{
              bgcolor: '#26374A',
              color: 'white',
              '&:hover': {
                bgcolor: '#1C578A'
              }
            }}
          >
            {t('auth.continueWithInterac')}
          </Button>

          <Button
            variant="outlined"
            sx={{
              color: '#26374A',
              borderColor: '#26374A',
              '&:hover': {
                borderColor: '#1C578A',
                bgcolor: 'rgba(38, 55, 74, 0.04)'
              }
            }}
          >
            {t('auth.continueWithPartner')}
          </Button>
        </Box>
      </Paper>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" 
          sx={{ 
            fontSize: '1.5rem', 
            fontWeight: 600,
            color: '#333',
            mb: 2 
          }}>
          {t('auth.firstTimeUser')}
        </Typography>
        <Button
          variant="text"
          sx={{
            color: '#284162',
            textDecoration: 'underline',
            '&:hover': {
              bgcolor: 'transparent',
              textDecoration: 'underline'
            }
          }}
          onClick={() => navigate('/signup')}
        >
          {t('auth.signUp')}
        </Button>
      </Box>

      <Box>
        <Typography variant="h2" 
          sx={{ 
            fontSize: '1.5rem', 
            fontWeight: 600,
            color: '#333',
            mb: 2 
          }}>
          {t('auth.needHelp')}
        </Typography>
        <Button
          variant="text"
          sx={{
            color: '#284162',
            textDecoration: 'underline',
            '&:hover': {
              bgcolor: 'transparent',
              textDecoration: 'underline'
            }
          }}
        >
          {t('auth.getHelp')}
        </Button>
      </Box>
    </Box>
  );
};

export default Home; 