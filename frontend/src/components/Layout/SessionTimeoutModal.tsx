import Modal from "react-modal";
import { useEffect } from "react";
import { GcdsButton, GcdsText, GcdsIcon } from "@gcds-core/components-react";
import { formatTime } from "../../utils/functions";
import { useTranslation } from "react-i18next";
import {
  setWarningFavicon,
  restoreDefaultFavicon,
} from "../../utils/faviconUtils";
import { useBreakpoints } from "../../hooks/useBreakpoints";

interface SessionTimeoutModalProps {
  isOpen: boolean;
  expirationTime: string | number | Date | null | undefined;
  onKeepSession: () => void | Promise<void>;
  onLogout: () => void | Promise<void>;
  isLoading?: boolean;
  currentLang: string;
}

const SessionTimeoutModal = ({
  isOpen,
  expirationTime,
  onKeepSession,
  onLogout,
  isLoading = false,
  currentLang,
}: SessionTimeoutModalProps) => {
  const { mobile, tablet } = useBreakpoints();
  const { t } = useTranslation("layout");

  // Change favicon when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setWarningFavicon();
    } else {
      restoreDefaultFavicon();
    }

    // Cleanup: restore default favicon when component unmounts
    return () => {
      restoreDefaultFavicon();
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const renderDesktopSessionTimeoutModal = () => {
    return (
      <>
        <Modal
          isOpen={isOpen}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEsc={false}
          ariaHideApp={false}
          contentLabel={t("SessionManagement.sessionEndingWarning")}
          className="session-timeout-modal"
          overlayClassName="session-timeout-modal-overlay"
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <GcdsIcon
              name="warning-triangle"
              size="h1"
              className="warning-icon"
            />
          </div>
          <div className="modal-header">
            <h2>{t("SessionManagement.sessionEndingWarning")}</h2>
          </div>

          <div className="session-timeout-content">
            <GcdsText size="body">
              {t("SessionManagement.autoSignOutNotice")}
            </GcdsText>

            <GcdsText size="body" className="mt-3">
              {t("SessionManagement.sessionExpiryTime", {
                time: formatTime(expirationTime, currentLang),
              })}
            </GcdsText>

            <GcdsText size="body" className="mt-3">
              {t("SessionManagement.continueSessionPrompt")}
            </GcdsText>

            <div className="d-flex gap-3 mt-4">
              <GcdsButton
                buttonId="keep-session-btn"
                size="regular"
                type="button"
                buttonRole="primary"
                onClick={onKeepSession}
                disabled={isLoading}
              >
                {isLoading
                  ? t("SessionManagement.extending")
                  : t("SessionManagement.staySignedIn")}
              </GcdsButton>

              <GcdsButton
                buttonId="logout-btn"
                size="regular"
                type="button"
                buttonRole="danger"
                onClick={onLogout}
                disabled={isLoading}
              >
                {t("SessionManagement.signOut")}
              </GcdsButton>
            </div>
          </div>
        </Modal>
      </>
    );
  };

  const renderMobileSessionTimeoutModal = () => {
    return (
      <>
        <Modal
          isOpen={isOpen}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEsc={false}
          ariaHideApp={false}
          contentLabel={t("SessionManagement.sessionEndingWarning")}
          className="session-timeout-modal mobile"
          overlayClassName="session-timeout-modal-overlay"
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <GcdsIcon
              name="warning-triangle"
              size="h1"
              className="warning-icon"
            />
          </div>
          <div className="modal-header">
            <h2>{t("SessionManagement.sessionEndingWarning")}</h2>
          </div>

          <div className="session-timeout-content">
            <GcdsText size="body">
              {t("SessionManagement.autoSignOutNotice")}
            </GcdsText>

            <GcdsText size="body" className="mt-3">
              {t("SessionManagement.sessionExpiryTime", {
                time: formatTime(expirationTime, currentLang),
              })}
            </GcdsText>

            <GcdsText size="body" className="mt-3">
              {t("SessionManagement.continueSessionPrompt")}
            </GcdsText>

            <div className="d-flex gap-3 mt-4">
              <GcdsButton
                buttonId="keep-session-btn"
                size="regular"
                type="button"
                buttonRole="primary"
                onClick={onKeepSession}
                disabled={isLoading}
              >
                {isLoading
                  ? t("SessionManagement.extending")
                  : t("SessionManagement.staySignedIn")}
              </GcdsButton>

              <GcdsButton
                buttonId="logout-btn"
                size="regular"
                type="button"
                buttonRole="danger"
                onClick={onLogout}
                disabled={isLoading}
              >
                {t("SessionManagement.signOut")}
              </GcdsButton>
            </div>
          </div>
        </Modal>
      </>
    );
  };

  const renderSessionTimeoutModal = () => {
    if (mobile || tablet) {
      return renderMobileSessionTimeoutModal();
    } else {
      return renderDesktopSessionTimeoutModal();
    }
  };

  return renderSessionTimeoutModal();
};

export default SessionTimeoutModal;
