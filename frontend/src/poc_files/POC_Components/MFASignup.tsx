import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from "@mui/material";
import { authService } from "../services/authService";

const MFASignup = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrData, setQrData] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    totpCode: "",
  });

  const steps = ["Account Details", "Scan QR Code", "Verify Code"];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitAccountDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userData = {
        userName: formData.email,
        password: formData.password,
        name: {
          givenName: formData.firstName,
          familyName: formData.lastName,
        },
      };

      console.log("Starting MFA signup...");
      const response = await authService.signupWithMFA(userData);
      console.log("MFA signup response:", response);

      if (response.qrcode) {
        setQrData({
          ...response,
          qrCode: response.qrcode,
          secretKey: response.secret,
        });
        setActiveStep(1);
      } else {
        console.error("Missing QR code in response:", response);
        throw new Error("Failed to get QR code");
      }
    } catch (error) {
      console.error("MFA signup error:", error);
      setError(
        error.response?.data?.detail || error.message || "MFA signup failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const verifyData = {
        userId: qrData.userId,
        totpId: qrData.totpId,
        totpCode: formData.totpCode,
      };

      console.log("Verifying TOTP code...");
      await authService.verifyMFATOTP(verifyData);
      console.log("TOTP verification successful");

      setActiveStep(2);
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error("TOTP verification error:", error);
      setError(
        error.response?.data?.detail ||
          error.message ||
          "TOTP verification failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Sign Up with MFA
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <form onSubmit={handleSubmitAccountDetails}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                type="password"
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                inputProps={{
                  minLength: 8,
                  pattern:
                    "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
                }}
                helperText="Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
              />
            </Box>
            {error && (
              <Box sx={{ mb: 2 }}>
                <Typography color="error">{error}</Typography>
              </Box>
            )}
            <Box sx={{ mt: 3 }}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Continue"}
              </Button>
            </Box>
          </form>
        )}

        {activeStep === 1 && qrData && (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Scan QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Scan this QR code with your authenticator app (e.g., Google
              Authenticator)
            </Typography>
            {qrData.qrCode ? (
              <Box sx={{ mb: 3 }}>
                <img
                  src={`data:image/png;base64,${qrData.qrCode}`}
                  alt="QR Code"
                  style={{ maxWidth: "200px", width: "100%" }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Secret Key: {qrData.secretKey}
                </Typography>
              </Box>
            ) : (
              <Typography color="error">
                Failed to load QR code. Please try again.
              </Typography>
            )}
            <form onSubmit={handleVerifyTOTP}>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Enter Code"
                  name="totpCode"
                  value={formData.totpCode}
                  onChange={handleChange}
                  required
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    maxLength: 6,
                    minLength: 6,
                  }}
                  helperText="Enter the 6-digit code from your authenticator app"
                />
              </Box>
              {error && (
                <Box sx={{ mb: 2 }}>
                  <Typography color="error">{error}</Typography>
                </Box>
              )}
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Verify Code"}
              </Button>
            </form>
          </Paper>
        )}

        {activeStep === 2 && (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Setup Complete!
            </Typography>
            <Typography variant="body1">
              Your account has been created successfully with MFA enabled.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Redirecting to login page...
            </Typography>
          </Paper>
        )}

        <Box sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="text"
            color="primary"
            onClick={() => navigate("/signup")}
          >
            Use Different Sign Up Method
          </Button>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="text"
            color="primary"
            onClick={() => navigate("/login")}
          >
            Already have an account? Sign in
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default MFASignup;
