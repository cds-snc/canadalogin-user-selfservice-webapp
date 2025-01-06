import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import PasskeyLogin from './components/PasskeyLogin';
import PasswordSignup from './components/PasswordSignup';
import PasskeySignIn from './components/PasskeySignIn';
import PasskeySignup from './components/PasskeySignup';
import MFASignIn from './components/MFASignIn';
import MFASignup from './components/MFASignup';
import MFAVerify from './components/MFAVerify';
import './i18n';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          backgroundColor: '#fff'
        }}>
          <Header />
          <main style={{ 
            flex: '1 0 auto',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '24px'
          }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/signin" element={<Login />} />
              <Route path="/signin/passkey" element={<PasskeyLogin />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signup/password" element={<PasswordSignup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/passkey-signin" element={<PasskeySignIn />} />
              <Route path="/signup/passkey" element={<PasskeySignup />} />
              <Route path="/signin/passkey" element={<PasskeyLogin />} />
              <Route path="/signin/mfa" element={<MFASignIn />} />
              <Route path="/signup/mfa" element={<MFASignup />} />
              <Route path="/signin/mfa/verify" element={<MFAVerify />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;