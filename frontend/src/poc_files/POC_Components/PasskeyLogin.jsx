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
} from "@mui/material";
import config from "../config";

function PasskeyLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasskeyAuth = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Get authentication options from server
      const optionsResponse = await fetch(
        `${config.apiUrl}/api/auth/passkey/options`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: email }),
        },
      );

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json();
        throw new Error(
          errorData.detail || "Failed to get authentication options",
        );
      }

      const options = await optionsResponse.json();
      console.log("Received options:", options);

      // 2. Create authentication credentials using WebAuthn
      const publicKeyCredentialRequestOptions = {
        challenge: base64URLToBuffer(options.challenge),
        rpId: window.location.hostname,
        timeout: options.timeout || 240000,
        userVerification: options.userVerification || "preferred",
        // Only include allowCredentials if it exists
        ...(options.allowCredentials && {
          allowCredentials: options.allowCredentials.map((cred) => ({
            id: base64URLToBuffer(cred.id),
            type: "public-key",
            transports: cred.transports || ["internal"],
          })),
        }),
      };

      console.log(
        "Requesting credential with options:",
        publicKeyCredentialRequestOptions,
      );

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (!credential) {
        throw new Error("No credential received from authenticator");
      }

      console.log("Received credential:", credential);

      // 3. Verify authentication with server
      const verificationData = {
        username: email,
        credential: {
          id: credential.id,
          rawId: bufferToBase64URL(credential.rawId),
          response: {
            authenticatorData: bufferToBase64URL(
              credential.response.authenticatorData,
            ),
            clientDataJSON: bufferToBase64URL(
              credential.response.clientDataJSON,
            ),
            signature: bufferToBase64URL(credential.response.signature),
            userHandle: credential.response.userHandle
              ? bufferToBase64URL(credential.response.userHandle)
              : null,
          },
          type: credential.type,
          clientExtensionResults: credential.getClientExtensionResults(),
        },
      };

      console.log("Sending verification data:", verificationData);

      const verificationResponse = await fetch(
        `${config.apiUrl}/api/auth/passkey/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(verificationData),
        },
      );

      if (!verificationResponse.ok) {
        const errorData = await verificationResponse.json();
        throw new Error(errorData.detail || "Authentication failed");
      }

      const { access_token } = await verificationResponse.json();

      // Store the token and redirect to dashboard
      localStorage.setItem("token", access_token);
      navigate("/dashboard");
    } catch (error) {
      console.error("Passkey authentication failed:", error);
      setError(error.message || "Authentication failed. Please try again.");
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
          Sign In with Passkey
        </Typography>

        <Paper elevation={3} sx={{ mt: 4, p: 4, width: "100%" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoFocus
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handlePasskeyAuth}
            disabled={loading || !email}
            sx={{ mb: 2 }}
          >
            {loading ? "Authenticating..." : "Continue with Passkey"}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

// Utility functions for WebAuthn buffer conversions
function bufferToBase64URL(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = "";
  bytes.forEach((byte) => (str += String.fromCharCode(byte)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64URLToBuffer(base64URL) {
  const base64 = base64URL.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLen);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

export default PasskeyLogin;
