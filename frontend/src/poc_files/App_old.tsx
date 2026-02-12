import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, CssBaseline, Container, Box } from "@mui/material";
import theme from "./theme";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import Home from "./POC_Components/Home";
import Login from "./POC_Components/Login";
import Signup from "./POC_Components/Signup";
import PasswordSignup from "./POC_Components/PasswordSignup";
import PasskeySignup from "./POC_Components/PasskeySignup";
import PasskeyLogin from "./POC_Components/PasskeyLogin";
import MFASignup from "./POC_Components/MFASignup";
import Dashboard from "./POC_Components/Dashboard";

function App_old() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
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

export default App_old;
