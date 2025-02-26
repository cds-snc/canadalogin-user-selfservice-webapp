import React from 'react';
import { AppBar, Toolbar, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#FFFFFF',
  boxShadow: 'none',
  borderBottom: '2px solid #335075',
}));

const Header = () => {
  const { i18n } = useTranslation();

  const logoUrl = i18n.language === 'fr' 
    ? 'https://www.canada.ca/etc/designs/canada/wet-boew/assets/sig-blk-fr.svg'
    : 'https://www.canada.ca/etc/designs/canada/wet-boew/assets/sig-blk-en.svg';

  const logoAlt = i18n.language === 'fr'
    ? 'Gouvernement du Canada'
    : 'Government of Canada';

  return (
    <StyledAppBar position="static">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box
          component="img"
          src={logoUrl}
          alt={logoAlt}
          sx={{
            height: 25,
            marginRight: 2,
            marginY: 2,
          }}
        />
        <LanguageSwitcher />
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header; 