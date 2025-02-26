import React from 'react';
import { Box, Container, Link, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        backgroundColor: '#F8F8F8',
        borderTop: '2px solid #335075',
        mt: 'auto',
        position: 'relative',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <Container 
        maxWidth="lg"
        sx={{
          py: 2,
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 1,
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Link
              href="https://www.canada.ca/en/social.html"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{
                color: '#284162',
                fontSize: '0.85rem',
                lineHeight: 1.4,
              }}
            >
              {t('footer.socialMedia')}
            </Link>
            <Link
              href="https://www.canada.ca/en/mobile.html"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{
                color: '#284162',
                fontSize: '0.85rem',
                lineHeight: 1.4,
              }}
            >
              {t('footer.mobileApps')}
            </Link>
            <Link
              href="https://www.canada.ca/en.html"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{
                color: '#284162',
                fontSize: '0.85rem',
                lineHeight: 1.4,
              }}
            >
              {t('footer.aboutCanada')}
            </Link>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Link
              href="https://www.canada.ca/en/transparency/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{
                color: '#284162',
                fontSize: '0.85rem',
                lineHeight: 1.4,
              }}
            >
              {t('footer.termsAndConditions')}
            </Link>
            <Link
              href="https://www.canada.ca/en/transparency/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{
                color: '#284162',
                fontSize: '0.85rem',
                lineHeight: 1.4,
              }}
            >
              {t('footer.privacy')}
            </Link>
          </Box>
        </Box>
        <Divider sx={{ my: 1, borderColor: '#ddd' }} />
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1,
            mt: 1,
          }}
        >
          <img
            src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/wmms-blk.svg"
            alt="Symbol of the Government of Canada"
            style={{ height: '25px' }}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;