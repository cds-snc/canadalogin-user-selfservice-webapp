import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import config from "../config";
import {
  X_GC_CLIENT_HEADER_NAME,
  X_GC_CLIENT_HEADER_VALUE,
} from "../../utils/axiosInstance.js";

function MFASignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${config.apiUrl}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [X_GC_CLIENT_HEADER_NAME]: X_GC_CLIENT_HEADER_VALUE,
        },
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
          factor: "mfa",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      // Redirect to MFA verification page with necessary data
      navigate("/signin/mfa/verify", {
        state: {
          email: formData.email,
          verificationToken: data.verification_token,
        },
      });
    } catch (error) {
      console.error("Sign-in failed:", error);
      setError(error.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Sign In with Password + MFA
        </Typography>

        <Paper elevation={3} sx={{ mt: 4, p: 4, width: "100%" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
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
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Continue"}
            </Button>
            <Button fullWidth variant="outlined" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default MFASignIn;
