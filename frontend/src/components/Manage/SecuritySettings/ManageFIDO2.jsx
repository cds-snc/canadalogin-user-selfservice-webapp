import {
  GcdsButton,
  GcdsContainer,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
  GcdsAlert,
  GcdsInput,
} from "@cdssnc/gcds-components-react";
import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router";
import { fido2Api } from "../../../features/ManageFIDO2/api/fido2Api.jsx";
import { PAGES } from "../../../utils/constants.jsx";
import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";
import Loader from "../../Layout/Loading.jsx";
import NoticeFactory from "../../InfoBlocks/NoticeFactory.jsx";
import {
  isWebAuthnSupported,
  registerFIDO2Credential,
  prepareAssertionOptions,
  formatAssertionForServer,
} from "../../../features/ManageFIDO2/utils/webAuthnUtils.js";
import VerifiedBadge from "../../Badges/VerifiedBadge.jsx";
import EnabledBadge from "../../Badges/EnabledBadge.jsx";
import { useUser } from "../../Providers/useUser.js";

export default function ManageFIDO2() {
  const { language } = useParams();
  const location = useLocation();
  const pageContent = getPageContent(language, PAGES.manageFIDO2);
  const navigate = useNavigate();

  // State management
  const [fido2Data, setFido2Data] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [authenticateLoading, setAuthenticateLoading] = useState(null); // Track which credential is being authenticated
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [credentialToRename, setCredentialToRename] = useState(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [renameDeviceName, setRenameDeviceName] = useState("");
  const { state } = useUser();
  console.log(state);

  // Check if we came from another page and need to render success notice
  const { noticeType, message } = location.state || {};
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });

  // Check WebAuthn support
  const webAuthnSupported = isWebAuthnSupported();

  /**
   * Fetch user's FIDO2 credentials
   */
  const fetchUserFIDO2Credentials = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fido2Api.getUserFIDO2Credentials();

      if (response && response.authenticated) {
        setFido2Data(response);
      } else {
        setError(pageContent["error_not_authenticated"] || "Not authenticated");
      }
    } catch (err) {
      console.error("Error fetching FIDO2 credentials:", err);

      // Handle authentication/authorization errors
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError(
          pageContent["error_session_expired"] ||
            "Your session has expired or you don't have permission to access this feature. Please go back to Security Settings and try again.",
        );
        // Don't redirect automatically - let user click back button
      } else {
        setError(
          pageContent["error_fetch_credentials"] ||
            "Failed to fetch FIDO2 credentials",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle adding new FIDO2 credential
   */
  const handleAddFIDO2 = async () => {
    if (!webAuthnSupported) {
      setError(
        pageContent["error_webauthn_not_supported"] ||
          "WebAuthn is not supported by your browser",
      );
      return;
    }

    setRegistrationLoading(true);
    setError(null);

    try {
      // Step 1: Get attestation options from server
      const attestationOptions = await fido2Api.getAttestationOptions({
        attestation: "direct",
        requireResidentKey: false,
        userVerification: "preferred",
        // authenticatorAttachment can be "platform", "cross-platform", or undefined
        // authenticatorAttachment: "cross-platform", // Uncomment to prefer external authenticators
      });

      if (!attestationOptions || attestationOptions.status !== "ok") {
        throw new Error("Failed to get attestation options");
      }

      // Step 2: Use WebAuthn API to create credential
      const attestationResult = await registerFIDO2Credential(
        attestationOptions,
        newDeviceName || "testfido2",
      );

      // Step 3: Send attestation result to server
      const response =
        await fido2Api.submitAttestationResult(attestationResult);

      if (response && response.status === "ok") {
        setSuccess(
          pageContent["success_credential_added"] ||
            "Security key successfully added",
        );
        setShowAddModal(false);
        setNewDeviceName("");
        // Refresh the credential list
        await fetchUserFIDO2Credentials();
      } else {
        throw new Error("Failed to register credential");
      }
    } catch (err) {
      console.error("Error adding FIDO2 credential:", err);

      // Extract specific error message from server response
      let errorMessage =
        pageContent["error_add_credential"] || "Failed to add security key";

      if (err.response?.data?.errorMessage) {
        // Handle fido2Error format from ciservices.js
        errorMessage = err.response.data.errorMessage;
      } else if (err.response?.data?.message) {
        // Handle IBM Verify error format
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401 || err.response?.status === 400) {
        errorMessage =
          pageContent["error_session_expired"] ||
          "Your session has expired or you don't have permission to access this feature. Please go back to Security Settings and try again.";
      } else if (err.message === "NotAllowedError") {
        errorMessage =
          pageContent["error_registration_cancelled"] ||
          "Registration was cancelled";
      }

      setError(errorMessage);
    } finally {
      setRegistrationLoading(false);
    }
  };

  /**
   * Handle deleting FIDO2 credential
   */
  const handleDeleteFIDO2 = async () => {
    if (!credentialToDelete) return;

    setDeleteLoading(true);
    setError(null);

    try {
      const response = await fido2Api.deleteRegistration(credentialToDelete.id);

      if (response && response.authenticated) {
        setSuccess(
          pageContent["success_credential_deleted"] ||
            "Security key successfully deleted",
        );
        setShowDeleteModal(false);
        setCredentialToDelete(null);
        // Update the local state with the response
        setFido2Data(response);
      } else {
        throw new Error("Failed to delete credential");
      }
    } catch (err) {
      console.error("Error deleting FIDO2 credential:", err);

      // Handle authentication/authorization errors
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError(
          pageContent["error_session_expired"] ||
            "Your session has expired or you don't have permission to access this feature. Please go back to Security Settings and try again.",
        );
      } else {
        setError(
          pageContent["error_delete_credential"] ||
            "Failed to delete security key",
        );
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  /**
   * Handle renaming FIDO2 credential
   */
  const handleRenameFIDO2 = async () => {
    if (!credentialToRename || !renameDeviceName.trim()) return;

    setRenameLoading(true);
    setError(null);

    try {
      const response = await fido2Api.updateRegistration(
        credentialToRename.id,
        { nickname: renameDeviceName.trim() },
      );

      if (response && response.authenticated) {
        setSuccess(
          pageContent["success_credential_renamed"] ||
            "Security key successfully renamed",
        );
        setShowRenameModal(false);
        setCredentialToRename(null);
        setRenameDeviceName("");
        // Update the local state with the response
        setFido2Data(response);
      } else {
        throw new Error("Failed to rename credential");
      }
    } catch (err) {
      console.error("Error renaming FIDO2 credential:", err);

      // Handle authentication/authorization errors
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError(
          pageContent["error_session_expired"] ||
            "Your session has expired or you don't have permission to access this feature. Please go back to Security Settings and try again.",
        );
      } else {
        setError(
          pageContent["error_rename_credential"] ||
            "Failed to rename security key",
        );
      }
    } finally {
      setRenameLoading(false);
    }
  };

  /**
   * Handle authenticating with a specific FIDO2 credential
   */
  const handleAuthenticate = async (credential) => {
    if (!webAuthnSupported) {
      setError(
        pageContent["webauthn_not_supported"] ||
          "Your browser does not support WebAuthn.",
      );
      return;
    }

    setAuthenticateLoading(credential.id);
    setError(null);

    try {
      // Step 1: Get assertion options from server
      const assertionOptions = await fido2Api.getAssertionOptions();

      // Step 2: Filter allowed credentials to only include the selected credential
      const filteredOptions = {
        ...assertionOptions,
        allowCredentials: assertionOptions.allowCredentials
          ? assertionOptions.allowCredentials.filter(
              (cred) => cred.id === credential.credentialId,
            )
          : [
              {
                id: credential.credentialId,
                type: "public-key",
                transports: ["usb", "nfc", "ble", "internal"],
              },
            ],
      };

      // Step 3: Prepare assertion options for WebAuthn API
      const preparedOptions = prepareAssertionOptions(filteredOptions);

      // Step 4: Call WebAuthn API to get assertion
      const assertion = await navigator.credentials.get({
        publicKey: preparedOptions,
      });

      if (!assertion) {
        throw new Error("Authentication was cancelled or failed");
      }

      // Step 5: Format assertion for server
      const assertionResult = formatAssertionForServer(assertion);

      // Step 6: Submit assertion result to server for verification
      const result = await fido2Api.submitAssertionResult(assertionResult);

      if (result.authenticated) {
        setSuccess(
          pageContent["authenticate_success"] ||
            `Authentication successful with ${credential.nickname || "security key"}!`,
        );
      } else {
        throw new Error("Authentication verification failed");
      }
    } catch (err) {
      console.error("Authentication error:", err);
      let errorMessage =
        pageContent["authenticate_error"] ||
        "Authentication failed. Please try again.";

      if (err.name === "NotAllowedError") {
        errorMessage =
          pageContent["authenticate_cancelled"] ||
          "Authentication was cancelled or timed out.";
      } else if (err.name === "InvalidStateError") {
        errorMessage =
          pageContent["authenticate_invalid_state"] ||
          "This security key is not registered or cannot be used.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setAuthenticateLoading(null);
    }
  };

  /**
   * Open delete confirmation modal
   */
  const openDeleteModal = (credential) => {
    setCredentialToDelete(credential);
    setShowDeleteModal(true);
  };

  /**
   * Open rename modal
   */
  const openRenameModal = (credential) => {
    setCredentialToRename(credential);
    setRenameDeviceName(credential.nickname || "");
    setShowRenameModal(true);
  };

  /**
   * Close modals and reset state
   */
  const closeModals = () => {
    setShowDeleteModal(false);
    setShowAddModal(false);
    setShowRenameModal(false);
    setCredentialToDelete(null);
    setCredentialToRename(null);
    setNewDeviceName("");
    setRenameDeviceName("");
    setAuthenticateLoading(null);
    setError(null);
  };

  // Load FIDO2 credentials on component mount
  useEffect(() => {
    fetchUserFIDO2Credentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  /**
   * Render individual FIDO2 credential item
   */
  const renderCredentialItem = (credential, index) => {
    const createdDate = credential.created
      ? new Date(credential.created).toLocaleDateString(
          language === "fr" ? "fr-CA" : "en-CA",
        )
      : pageContent["unknown_date"] || "Unknown";

    return (
      <GcdsContainer
        key={credential.id || index}
        className="credential-item"
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <GcdsText size="h6" tag="h3">
              <strong>
                {credential.nickname ||
                  pageContent["unnamed_device"] ||
                  "Unnamed Device"}
              </strong>
            </GcdsText>
            <GcdsText size="caption">
              {pageContent["created"] || "Created"}: {createdDate}
            </GcdsText>
            <div style={{ marginTop: "0.5rem" }}>
              {credential.enabled ? (
                <EnabledBadge text={pageContent["enabled"] || "Enabled"} />
              ) : (
                <span className="badge badge-disabled">
                  {pageContent["disabled"] || "Disabled"}
                </span>
              )}
            </div>
          </div>
          <div
            style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}
          >
            <GcdsButton
              buttonRole="primary"
              size="small"
              onClick={() => handleAuthenticate(credential)}
              disabled={
                !webAuthnSupported ||
                authenticateLoading === credential.id ||
                !credential.enabled
              }
            >
              {authenticateLoading === credential.id
                ? pageContent["authenticating"] || "Authenticating..."
                : pageContent["authenticate"] || "Authenticate"}
            </GcdsButton>
            <GcdsButton
              buttonRole="secondary"
              size="small"
              onClick={() => openRenameModal(credential)}
              disabled={renameLoading}
            >
              {pageContent["rename"] || "Rename"}
            </GcdsButton>
            <GcdsButton
              buttonRole="destructive"
              size="small"
              onClick={() => openDeleteModal(credential)}
              disabled={deleteLoading}
            >
              {pageContent["delete"] || "Delete"}
            </GcdsButton>
          </div>
        </div>
      </GcdsContainer>
    );
  };

  if (loading) {
    return <Loader text={pageContent["loading"] || "Loading..."} />;
  }

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1" size="h3">
        {pageContent["title"] || "Manage Security Keys (FIDO2)"}
      </GcdsHeading>

      {/* Back link */}
      <GcdsLink
        href={backToSecuritySettingsPage}
        size="regular"
        onGcdsClick={(ev) => {
          ev.preventDefault();
          navigate(backToSecuritySettingsPage);
        }}
      >
        {pageContent["back_to_security"] || "← Back to Security Settings"}
      </GcdsLink>

      {/* Notice messages */}
      {noticeType && message && (
        <NoticeFactory type={noticeType} message={message} />
      )}

      {/* Success/Error messages */}
      {success && (
        <GcdsAlert
          alertRole="success"
          heading={pageContent["success"] || "Success"}
        >
          {success}
        </GcdsAlert>
      )}

      {error && (
        <GcdsAlert alertRole="danger" heading={pageContent["error"] || "Error"}>
          {error}
        </GcdsAlert>
      )}

      {/* WebAuthn support warning */}
      {!webAuthnSupported && (
        <GcdsAlert
          alertRole="warning"
          heading={pageContent["warning"] || "Warning"}
        >
          {pageContent["webauthn_not_supported"] ||
            "Your browser does not support WebAuthn. You will not be able to register new security keys."}
        </GcdsAlert>
      )}

      {/* Main content */}
      <div style={{ marginTop: "2rem" }}>
        <GcdsText>
          {pageContent["description"] ||
            "Security keys (FIDO2) provide strong two-factor authentication. You can register multiple security keys for backup purposes."}
        </GcdsText>

        {/* Add new security key button */}
        <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
          <GcdsButton
            onClick={() => setShowAddModal(true)}
            disabled={!webAuthnSupported || registrationLoading}
          >
            {registrationLoading
              ? pageContent["adding"] || "Adding..."
              : pageContent["add_security_key"] || "Add Security Key"}
          </GcdsButton>
        </div>

        {/* Credentials list */}
        {fido2Data &&
        fido2Data.credentials &&
        fido2Data.credentials.length > 0 ? (
          <>
            <GcdsHeading tag="h2" size="h4" style={{ marginTop: "2rem" }}>
              {pageContent["registered_keys"] || "Registered Security Keys"}
            </GcdsHeading>
            {fido2Data.credentials.map((credential, index) =>
              renderCredentialItem(credential, index),
            )}
          </>
        ) : (
          <GcdsNotice
            type="info"
            heading={pageContent["no_keys"] || "No Security Keys"}
          >
            {pageContent["no_keys_message"] ||
              "You don't have any security keys registered yet. Click 'Add Security Key' to register your first security key."}
          </GcdsNotice>
        )}
      </div>

      {/* Add Security Key Form */}
      {showAddModal && (
        <GcdsContainer
          style={{
            border: "1px solid #ccc",
            padding: "1rem",
            marginTop: "1rem",
            borderRadius: "4px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <GcdsHeading tag="h3">
            {pageContent["add_security_key"] || "Add Security Key"}
          </GcdsHeading>
          <GcdsText>
            {pageContent["add_description"] ||
              "Give your security key a name to help you identify it later."}
          </GcdsText>

          <GcdsInput
            inputId="device-name"
            label={pageContent["device_name"] || "Device Name"}
            value={newDeviceName}
            onGcdsInput={(e) => setNewDeviceName(e.target.value)}
            placeholder={
              pageContent["device_name_placeholder"] || "e.g., My YubiKey"
            }
          />

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
            <GcdsButton onClick={handleAddFIDO2} disabled={registrationLoading}>
              {registrationLoading
                ? pageContent["registering"] || "Registering..."
                : pageContent["register"] || "Register"}
            </GcdsButton>
            <GcdsButton
              buttonRole="secondary"
              onClick={closeModals}
              disabled={registrationLoading}
            >
              {pageContent["cancel"] || "Cancel"}
            </GcdsButton>
          </div>
        </GcdsContainer>
      )}

      {/* Delete Confirmation Form */}
      {showDeleteModal && credentialToDelete && (
        <GcdsContainer
          style={{
            border: "2px solid #d93025",
            padding: "1rem",
            marginTop: "1rem",
            borderRadius: "4px",
            backgroundColor: "#fef7f6",
          }}
        >
          <GcdsHeading tag="h3">
            {pageContent["confirm_delete"] || "Confirm Delete"}
          </GcdsHeading>
          <GcdsText>
            {pageContent["delete_confirmation"] ||
              "Are you sure you want to delete this security key?"}
          </GcdsText>
          <GcdsText>
            <strong>
              {credentialToDelete.nickname ||
                pageContent["unnamed_device"] ||
                "Unnamed Device"}
            </strong>
          </GcdsText>
          <GcdsText size="caption">
            {pageContent["delete_warning"] || "This action cannot be undone."}
          </GcdsText>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
            <GcdsButton
              buttonRole="destructive"
              onClick={handleDeleteFIDO2}
              disabled={deleteLoading}
            >
              {deleteLoading
                ? pageContent["deleting"] || "Deleting..."
                : pageContent["delete"] || "Delete"}
            </GcdsButton>
            <GcdsButton
              buttonRole="secondary"
              onClick={closeModals}
              disabled={deleteLoading}
            >
              {pageContent["cancel"] || "Cancel"}
            </GcdsButton>
          </div>
        </GcdsContainer>
      )}

      {/* Rename Security Key Form */}
      {showRenameModal && credentialToRename && (
        <GcdsContainer
          style={{
            border: "1px solid #0056b3",
            padding: "1rem",
            marginTop: "1rem",
            borderRadius: "4px",
            backgroundColor: "#f0f8ff",
          }}
        >
          <GcdsHeading tag="h3">
            {pageContent["rename_security_key"] || "Rename Security Key"}
          </GcdsHeading>
          <GcdsText>
            {pageContent["rename_description"] ||
              "Enter a new name for your security key."}
          </GcdsText>
          <GcdsText>
            <strong>
              Current name:{" "}
              {credentialToRename.nickname ||
                pageContent["unnamed_device"] ||
                "Unnamed Device"}
            </strong>
          </GcdsText>

          <GcdsInput
            inputId="rename-device-name"
            label={pageContent["new_device_name"] || "New Device Name"}
            value={renameDeviceName}
            onGcdsInput={(e) => setRenameDeviceName(e.target.value)}
            placeholder={
              pageContent["device_name_placeholder"] || "e.g., My YubiKey"
            }
            style={{ marginTop: "1rem" }}
          />

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
            <GcdsButton
              onClick={handleRenameFIDO2}
              disabled={renameLoading || !renameDeviceName.trim()}
            >
              {renameLoading
                ? pageContent["renaming"] || "Renaming..."
                : pageContent["rename"] || "Rename"}
            </GcdsButton>
            <GcdsButton
              buttonRole="secondary"
              onClick={closeModals}
              disabled={renameLoading}
            >
              {pageContent["cancel"] || "Cancel"}
            </GcdsButton>
          </div>
        </GcdsContainer>
      )}
    </GcdsContainer>
  );
}
