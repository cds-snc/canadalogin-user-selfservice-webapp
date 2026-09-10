import { useState } from "react";

import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsText,
} from "@gcds-core/components-react";

import AccessibleNotice from "../../../components/InfoBlocks/AccessibleNotice";
import { useTranslation } from "react-i18next";

import { useParams } from "react-router";
import { FLOW_TYPES } from "../../../utils/constants";
import { handleLinkButtonKeyDown } from "../../../utils/accessibility";
import SubmitButton from "../../../components/Layout/SubmitButton";
import { useBreakpoints } from "../../../hooks/useBreakpoints";
import { useOtpExpiryCountdown } from "../../../hooks/useOtpExpiryCountdown";
import { shouldDisplayOtpMaxAttempts } from "../../../utils/otpErrorMapping";
import type { OtpFactor } from "../../../types/hooks";

type CaughtApiError = {
  data?: { message?: string; retries?: number; attempts?: number };
};

const initialTime = 10;
const OTP_CODE_MAX_LENGTH = 6;

interface OtpVerificationProps {
  userSelectedMfaFactor: OtpFactor;
  setUserOtpValue: (value: string) => void;
  userOtpValue: string;
  onBack: () => void;
  requestOtpCode: () => Promise<void | boolean>;
  validateOtpCode: (otpValue: string) => Promise<void>;
  setErrorCode: (errorCode: string) => void;
  setErrorMessage?: (errorMessage: string) => void;
  errorMessage?: string;
  onCancel: () => void;
  showTryAnotherWay?: boolean;
  resetAttempts?: () => void;
  otpExpiry?: string | null;
  otpCreatedAt?: string | null;
}

export default function OtpVerification({
  userSelectedMfaFactor,
  setUserOtpValue,
  userOtpValue,
  onBack,
  requestOtpCode,
  validateOtpCode,
  setErrorCode,
  setErrorMessage,
  errorMessage,
  showTryAnotherWay = true,
  resetAttempts,
  otpExpiry = null,
  otpCreatedAt = null,
  onCancel,
}: OtpVerificationProps) {
  const { language } = useParams();
  const [codeRequested, setCodeRequested] = useState(false);
  const { t } = useTranslation(["verification", "common"]);
  const { mobile } = useBreakpoints();
  const [localError, setLocalError] = useState("");
  const {
    fallbackSeconds,
    formattedCountdown,
    hasServerExpiry,
    isExpired: isOtpExpired,
    restartFallbackCountdown,
  } = useOtpExpiryCountdown(otpExpiry, initialTime, otpCreatedAt);

  const displayError = localError || errorMessage || "";
  const shouldShowSuccessNotice = codeRequested && !displayError;
  const countdownDisplay = hasServerExpiry ? formattedCountdown : null;
  const otpInputSize = mobile ? 18 : 6;

  const handleChange = (e: CustomEvent<string>) => {
    const value = (e.target as HTMLInputElement).value;
    const sanitizedValue = value
      .replace(/\D/g, "")
      .slice(0, OTP_CODE_MAX_LENGTH);
    setUserOtpValue(sanitizedValue);
  };

  const doSubmit = async () => {
    setLocalError("");
    setErrorCode("");
    setErrorMessage?.("");

    const normalizedOtp = userOtpValue
      .replace(/\D/g, "")
      .slice(0, OTP_CODE_MAX_LENGTH);
    if (normalizedOtp.length < OTP_CODE_MAX_LENGTH) {
      const invalidCodeMessage = t("Error.invalidCode", { ns: "common" });
      setLocalError(invalidCodeMessage);
      setErrorMessage?.(invalidCodeMessage);
      setErrorCode("invalidCode");
      return;
    }

    try {
      await validateOtpCode(normalizedOtp);
    } catch (error) {
      const apiError = error as CaughtApiError;
      const messageId = apiError?.data?.message;
      const retries = apiError?.data?.retries;
      const attempts = apiError?.data?.attempts;

      if (
        shouldDisplayOtpMaxAttempts({
          errorCode: messageId,
          retries,
          attempts,
        })
      ) {
        const maxAttemptsMsg = t("Error.otp_max_attempts", { ns: "common" });
        setLocalError(maxAttemptsMsg);
        setErrorMessage?.(maxAttemptsMsg);
        setErrorCode("otp_max_attempts");
        return;
      }

      if (
        retries !== undefined &&
        retries !== null &&
        attempts !== undefined &&
        attempts !== null
      ) {
        // The backend enriches the error with retries (max allowed) and
        // attempts (used so far) from the IBM Verify retrieve endpoint.
        const remaining = retries - attempts;
        const invalidAttemptsMsg = t("Error.otp_invalid_attempts", {
          ns: "common",
          count: remaining,
        });
        setLocalError(invalidAttemptsMsg);
        setErrorMessage?.(invalidAttemptsMsg);
        // Also set errorCode so the parent's StepContent shows
        // the error summary at the top of the page
        if (messageId) {
          setErrorCode(messageId);
        }
      } else if (messageId) {
        // No retries info — delegate to parent via setErrorCode
        setErrorCode(messageId);
      }
    }
  };

  const onSubmitHandler: React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    void doSubmit();
  };

  const userMfaType = userSelectedMfaFactor?.type;
  const isEmailFactor =
    userMfaType === FLOW_TYPES.email || userMfaType === FLOW_TYPES.emailOtp;

  const handleRequestNewCode = async () => {
    const requestSucceeded = await requestOtpCode();

    if (requestSucceeded === false) {
      setCodeRequested(false);
      return;
    }

    setErrorCode("");
    setErrorMessage?.("");
    setUserOtpValue("");
    setLocalError("");
    resetAttempts?.();
    restartFallbackCountdown();
    setCodeRequested(true);
  };

  const requestNewCodeAction = () => {
    void handleRequestNewCode();
  };

  return (
    <GcdsContainer role="main">
      {shouldShowSuccessNotice ? (
        <AccessibleNotice
          noticeRole="success"
          noticeTitleTag="h2"
          noticeTitle={t("Verification.successTitle")}
          data-testid="linkSuccess"
        >
          <GcdsText>{t("Verification.newCodeSent")}</GcdsText>
        </AccessibleNotice>
      ) : null}

      <GcdsContainer>
        <GcdsHeading tag="h1" lang={language}>
          {isEmailFactor
            ? t("CheckYourEmail.checkYourEmail")
            : t("Verification.checkYourPhone")}
        </GcdsHeading>

        {isOtpExpired ? (
          <>
            <GcdsText>{t("Verification.expiredMessage")}</GcdsText>

            <GcdsGrid
              columns={
                showTryAnotherWay ? "max-content" : "max-content max-content"
              }
              gap="200"
            >
              <GcdsButton
                style={{ width: "fit-content" }}
                onGcdsClick={(ev) => {
                  ev.preventDefault();
                  void handleRequestNewCode();
                }}
              >
                {t("Verification.requestNewCode")}
              </GcdsButton>

              {showTryAnotherWay ? (
                <GcdsButton
                  buttonRole="secondary"
                  style={{ width: "fit-content" }}
                  onGcdsClick={(ev) => {
                    ev.preventDefault();
                    onBack();
                  }}
                >
                  {t("Verification.chooseDifferentMethod")}
                </GcdsButton>
              ) : (
                <GcdsButton
                  buttonRole="secondary"
                  style={{ width: "fit-content" }}
                  onGcdsClick={(ev) => {
                    ev.preventDefault();
                    onCancel();
                  }}
                >
                  {t("Verification.cancel")}
                </GcdsButton>
              )}
            </GcdsGrid>
          </>
        ) : (
          <>
            {isEmailFactor && (
              <GcdsText>{t("CheckYourEmail.toChangeYourPassword")}</GcdsText>
            )}
            <GcdsText>
              {userMfaType === FLOW_TYPES.voice
                ? t("Verification.voiceCodeSent")
                : userMfaType === FLOW_TYPES.sms
                  ? t("Verification.smsCodeSent")
                  : t("CheckYourEmail.emailCodeSent")}
              &nbsp;
              <strong>{userSelectedMfaFactor.destination}</strong>
            </GcdsText>
            <GcdsText>
              {userMfaType === FLOW_TYPES.voice
                ? t("Verification.callMayTakeMinutes")
                : userMfaType === FLOW_TYPES.sms
                  ? t("Verification.smsMayTakeMinutes")
                  : t("CheckYourEmail.emailMayTakeMinutes")}
            </GcdsText>
            <GcdsText>
              {t("Verification.codeExpiresIn")}{" "}
              <strong>
                {countdownDisplay ?? t("Verification.tenMinutes")}
              </strong>
            </GcdsText>
            {!isEmailFactor && (
              <GcdsHeading tag="h2">{t("Verification.enterCode")}</GcdsHeading>
            )}

            <form onSubmit={onSubmitHandler}>
              <GcdsInput
                inputId="verificationCode"
                label={t("Verification.sixDigitCode")}
                name="verificationCode"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength={OTP_CODE_MAX_LENGTH}
                validateOn="other"
                errorMessage={displayError}
                value={userOtpValue}
                onGcdsInput={handleChange}
                lang={language}
                size={otpInputSize}
                autocomplete="one-time-code"
                autoFocus
              ></GcdsInput>
            </form>

            <GcdsGrid
              columns={
                showTryAnotherWay ? "max-content" : "max-content max-content"
              }
              gap="200"
            >
              <SubmitButton
                onGcdsClick={(ev) => {
                  ev.preventDefault();
                  void doSubmit();
                }}
                currentLang={language ?? "en"}
              ></SubmitButton>

              {showTryAnotherWay ? (
                <GcdsButton
                  buttonRole="secondary"
                  style={{ width: "fit-content" }}
                  onGcdsClick={(ev) => {
                    ev.preventDefault();
                    onBack();
                  }}
                >
                  {t("Verification.chooseDifferentMethod")}
                </GcdsButton>
              ) : (
                <GcdsButton
                  buttonRole="secondary"
                  style={{ width: "fit-content" }}
                  onGcdsClick={(ev) => {
                    ev.preventDefault();
                    onCancel();
                  }}
                >
                  {t("Verification.cancel")}
                </GcdsButton>
              )}
            </GcdsGrid>
          </>
        )}
      </GcdsContainer>

      <GcdsHeading tag="h2">{t("Verification.problemsWithCode")}</GcdsHeading>

      <GcdsText>
        {!isOtpExpired && fallbackSeconds > 0 ? (
          <span>
            {t("Verification.requestNewCodeIn")}
            <strong>
              {" "}
              {fallbackSeconds} {t("Verification.seconds")}
            </strong>
          </span>
        ) : (
          <GcdsLink
            role="button"
            style={{ textDecoration: "underline" }}
            onGcdsClick={requestNewCodeAction}
            onKeyDown={(event) =>
              handleLinkButtonKeyDown(event, requestNewCodeAction)
            }
          >
            {!isEmailFactor
              ? t("Verification.requestNewCode")
              : t("CheckYourEmail.sendCodeAgain")}
          </GcdsLink>
        )}
      </GcdsText>
    </GcdsContainer>
  );
}
