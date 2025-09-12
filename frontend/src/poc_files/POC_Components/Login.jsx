import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  TextField,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { authService } from "../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    userName: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const response = await authService.passwordSignIn(formData);
      console.log("Login response:", response); // Debug log

      if (response.access_token) {
        localStorage.setItem("token", response.access_token);

        // Find the name attribute in the attributes array
        let name = formData.userName.split("@")[0]; // default to email prefix
        if (response.attributes && Array.isArray(response.attributes)) {
          const nameAttribute = response.attributes.find(
            (attr) =>
              attr.name === "name" &&
              attr.values &&
              Array.isArray(attr.values) &&
              attr.values.length > 0,
          );
          if (nameAttribute) {
            name = nameAttribute.values[0];
          }
        }

        // Store user info
        const userInfo = {
          email: formData.userName,
          name: name,
        };

        console.log("Storing user info:", userInfo); // Debug log
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        navigate("/dashboard");
      } else {
        throw new Error("No access token received");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.detail || error.message || t("common.error"),
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
        {t("auth.signInWithPassword")}
      </Typography>

      <Paper elevation={0} sx={{ p: 4, border: "1px solid #CCCCCC" }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label={t("common.email")}
              name="userName"
              type="email"
              value={formData.userName}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t("common.password")}
              name="password"
              type="password"
              value={formData.password}
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
              {loading ? <CircularProgress size={24} /> : t("common.signIn")}
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              size="large"
              fullWidth
            >
              {t("auth.backToOptions")}
            </Button>
          </Box>
        </form>
      </Paper>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {t("auth.noAccount")}{" "}
          <Button variant="text" onClick={() => navigate("/signup")}>
            {t("common.register")}
          </Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
