import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import KeyIcon from "@mui/icons-material/Key";
import { authService } from "../services/authService";

const PasskeySignup = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });

  const steps = ["Account Details", "Create Passkey"];

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
        name: {
          givenName: formData.firstName,
          familyName: formData.lastName,
        },
      };

      await authService.signupWithPasskey(userData);
      setActiveStep(1);
      navigate("/signin/passkey"); // Add redirect after successful registration
    } catch (error) {
      console.error("Passkey registration error:", error);
      setError(
        error.response?.data?.detail || error.message || "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: "sm", mx: "auto" }}>
      <Typography
        variant="h1"
        component="h1"
        gutterBottom
        align="center"
        sx={{ mb: 4 }}
      >
        Register with Passkey
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 ? (
        <Paper elevation={0} sx={{ p: 4, border: "1px solid #CCCCCC" }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <KeyIcon sx={{ fontSize: 64, color: "primary.main" }} />
          </Box>

          <form onSubmit={handleSubmitAccountDetails}>
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
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                size="large"
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : "Continue"}
              </Button>

              <Button
                variant="outlined"
                onClick={() => navigate("/")}
                size="large"
                fullWidth
              >
                Back to Sign In Options
              </Button>
            </Box>
          </form>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ p: 4, border: "1px solid #CCCCCC" }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <KeyIcon sx={{ fontSize: 64, color: "primary.main" }} />
            <Typography variant="h2" gutterBottom>
              Create Your Passkey
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              Follow your device's prompts to create a passkey. This will allow
              you to sign in securely without a password.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Once completed, you'll be redirected to sign in.
            </Typography>
          </Box>
        </Paper>
      )}

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{" "}
          <Button variant="text" onClick={() => navigate("/signin/passkey")}>
            Sign in with Passkey
          </Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default PasskeySignup;
