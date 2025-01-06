import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container, Box } from '@mui/material';
import theme from './theme';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import PasswordSignup from './components/PasswordSignup';
import PasskeySignup from './components/PasskeySignup';
import PasskeyLogin from './components/PasskeyLogin';
import MFASignup from './components/MFASignup';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
          <Header />
          <Container maxWidth="md" sx={{ pt: 4, pb: 8 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signin" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signup/password" element={<PasswordSignup />} />
              <Route path="/signup/passkey" element={<PasskeySignup />} />
              <Route path="/login/passkey" element={<PasskeyLogin />} />
              <Route path="/signin/passkey" element={<PasskeyLogin />} />
              <Route path="/signup/mfa" element={<MFASignup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Container>
          <Footer />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 