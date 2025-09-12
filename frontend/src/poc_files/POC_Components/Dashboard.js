import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Divider,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { authService } from "../services/authService";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const storedUserInfo = localStorage.getItem("userInfo");

      if (!token) {
        navigate("/signin");
        return;
      }

      if (storedUserInfo) {
        try {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          console.log("Parsed user info:", parsedUserInfo);
          setUserInfo(parsedUserInfo);
        } catch (err) {
          console.error("Error parsing user info:", err);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleSignOut = () => {
    authService.logout();
    navigate("/");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const userName = userInfo?.name || "User";

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Paper elevation={0} sx={{ p: 4, border: "1px solid #CCCCCC" }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountCircleIcon
                  sx={{ fontSize: 40, color: "primary.main", mr: 2 }}
                />
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{ fontSize: "2rem", fontWeight: 600 }}
                >
                  {t("dashboard.welcomeMessage", { name: userName })}
                </Typography>
              </Box>
              <Divider sx={{ my: 3 }} />
            </Grid>

            <Grid item xs={12} md={8}>
              <Typography variant="body1" paragraph>
                {t("dashboard.successMessage")}
              </Typography>
              <Typography variant="body1" paragraph>
                {t("dashboard.accessMessage")}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleSignOut}
                  startIcon={<LogoutIcon />}
                >
                  {t("common.signOut")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{ p: 3, height: "100%", border: "1px solid #CCCCCC" }}
          >
            <Typography
              variant="h2"
              gutterBottom
              sx={{ fontSize: "1.5rem", fontWeight: 600 }}
            >
              {t("dashboard.accountSecurity")}
            </Typography>
            <Typography variant="body1" paragraph>
              {t("dashboard.securityMessage")}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{ p: 3, height: "100%", border: "1px solid #CCCCCC" }}
          >
            <Typography
              variant="h2"
              gutterBottom
              sx={{ fontSize: "1.5rem", fontWeight: 600 }}
            >
              {t("dashboard.needHelp")}
            </Typography>
            <Typography variant="body1" paragraph>
              {t("dashboard.helpMessage")}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
