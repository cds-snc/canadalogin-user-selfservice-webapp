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

import AccessibleNotice from "../../components/InfoBlocks/AccessibleNotice";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import SubmitButton from "../../components/Layout/SubmitButton";
import { useBreakpoints } from "../../hooks/useBreakpoints";
import { useOtpExpiryCountdown } from "../../hooks/useOtpExpiryCountdown";

type EmailFormData = {
  emailAddress: string;
};

const OTP_CODE_MAX_LENGTH = 6;

interface EmailOtpValidationProps {
  onSubmit: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  formData: EmailFormData;
  setFormData: (data: EmailFormData) => void;
  errorMessage?: string;
  setErrorCode?: (errorCode: string) => void;
  setErrorMessage?: (errorMessage: string) => void;
  userOtpValue: string;
  handleChange: (value: string) => void;
  requestOtpCode: () => Promise<void | boolean>;
  onBack: () => void | Promise<void>;
  isMaxAttemptsReached?: boolean;
  resetAttempts?: () => void;
  otpExpiry?: string | null;
  otpCreatedAt?: string | null;
}

export default function EmailOtpValidation({
  onSubmit,
  onCancel,
  formData,
  setFormData,
  errorMessage,
  setErrorCode,
  setErrorMessage,
  userOtpValue,
  handleChange,
  requestOtpCode,
  onBack,
  isMaxAttemptsReached: _isMaxAttemptsReached = false,
  resetAttempts,
  otpExpiry = null,
  otpCreatedAt = null,
}: EmailOtpValidationProps) {
  const { language } = useParams();
  const { t } = useTranslation(["email", "verification", "common"]);
  const { mobile } = useBreakpoints();

  const [localError, setLocalError] = useState("");
  const [showResendSuccessNotice, setShowResendSuccessNotice] = useState(false);
  const {
    fallbackSeconds,
    formattedCountdown,
    hasServerExpiry,
    isExpired,
    restartFallbackCountdown,
  } = useOtpExpiryCountdown(otpExpiry, 10, otpCreatedAt);

  const displayError = localError || errorMessage || "";
  const otpInputSize = mobile ? 18 : 6;

  const clearValues = () => {
    setFormData({ emailAddress: "" });
  };

  const handleInputChange = (e: CustomEvent<string>) => {
    const value = (e.target as HTMLInputElement).value;
    const sanitizedValue = value
      .replace(/\D/g, "")
      .slice(0, OTP_CODE_MAX_LENGTH);
    handleChange(sanitizedValue);
    setLocalError("");
  };

  const doSubmit = async () => {
    setLocalError("");
    setErrorCode?.("");
    setErrorMessage?.("");

    const normalizedOtp = userOtpValue
      .replace(/\D/g, "")
      .slice(0, OTP_CODE_MAX_LENGTH);
    if (normalizedOtp.length < OTP_CODE_MAX_LENGTH) {
      const invalidCodeMessage = t("Error.invalidCode", { ns: "common" });
      setLocalError(invalidCodeMessage);
      setErrorMessage?.(invalidCodeMessage);
      setErrorCode?.("invalidCode");
      return;
    }

    await onSubmit();
  };

  const onSubmitHandler: React.FormEventHandler<HTMLFormElement> = async (
    ev,
  ) => {
    ev.preventDefault();
    void doSubmit();
  };

  const handleResendCode = async (ev?: Event) => {
    ev?.preventDefault();
    if (requestOtpCode) {
      try {
        const resendResult = await requestOtpCode();
        const resendSucceeded = resendResult !== false;

        if (resendSucceeded) {
          setShowResendSuccessNotice(true);
          setErrorCode?.("");
          setErrorMessage?.("");
          handleChange("");
          setLocalError("");
          restartFallbackCountdown();
          resetAttempts?.();
        } else {
          setShowResendSuccessNotice(false);
        }
      } catch {
        setShowResendSuccessNotice(false);
      }
    }
  };

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="300">
        {showResendSuccessNotice ? (
          <AccessibleNotice
            noticeRole="success"
            noticeTitle={t("Verification.successTitle", {
              ns: "verification",
            })}
            noticeTitleTag="h2"
            lang={language}
          >
            <GcdsText>
              {t("Verification.newCodeSent", {
                ns: "verification",
              })}
            </GcdsText>
          </AccessibleNotice>
        ) : null}

        <GcdsHeading tag="h1" lang={language}>
          {t("EmailOtpValidation.title")}
        </GcdsHeading>

        {isExpired ? (
          <>
            <GcdsText>
              {t("Verification.expiredMessage", { ns: "verification" })}
            </GcdsText>

            <GcdsGrid columns="max-content max-content" gap="200">
              <GcdsButton onGcdsClick={handleResendCode}>
                {t("EmailOtpValidation.requestNewCode")}
              </GcdsButton>
              <GcdsButton
                buttonRole="secondary"
                onGcdsClick={async (ev) => {
                  ev.preventDefault();
                  clearValues();
                  await onBack();
                }}
              >
                {t("Verification.chooseDifferentMethod", {
                  ns: "verification",
                })}
              </GcdsButton>
            </GcdsGrid>
          </>
        ) : (
          <>
            <GcdsText>
              {t("EmailOtpValidation.codeSent")}{" "}
              <strong>{formData.emailAddress}</strong>
            </GcdsText>

            <GcdsText>{t("EmailOtpValidation.emailMayTakeMinutes")}</GcdsText>

            <GcdsText>
              {t("EmailOtpValidation.codeExpiresIn")}{" "}
              <strong>
                {hasServerExpiry
                  ? formattedCountdown
                  : t("EmailOtpValidation.tenMinutes")}
              </strong>
            </GcdsText>

            <form onSubmit={onSubmitHandler}>
              <GcdsGrid columns="1" gap="300">
                <GcdsInput
                  label={t("EmailOtpValidation.sixDigitCode")}
                  id="verificationCode"
                  inputId="verificationCode"
                  name="verificationCode"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength={OTP_CODE_MAX_LENGTH}
                  autocomplete="one-time-code"
                  validateOn="other"
                  errorMessage={displayError}
                  value={userOtpValue}
                  onGcdsInput={handleInputChange}
                  lang={language}
                  size={otpInputSize}
                  autoFocus
                />

                <GcdsGrid columns="max-content max-content" gap="200">
                  <SubmitButton currentLang={language ?? "en"} />
                  <GcdsButton
                    buttonRole="secondary"
                    onGcdsClick={(ev) => {
                      ev.preventDefault();
                      void onCancel();
                    }}
                  >
                    {t("Button.cancel", { ns: "common" })}
                  </GcdsButton>
                </GcdsGrid>
              </GcdsGrid>
            </form>
          </>
        )}

        <GcdsHeading tag="h2">
          {t("EmailOtpValidation.problemsWithCode")}
        </GcdsHeading>

        <GcdsText>
          <GcdsLink
            style={{ textDecoration: "underline" }}
            onGcdsClick={async () => {
              clearValues();
              await onBack();
            }}
          >
            {t("EmailOtpValidation.useDifferentEmail")}
          </GcdsLink>
        </GcdsText>

        <GcdsText>
          {!isExpired && fallbackSeconds > 0 ? (
            <span>
              {t("EmailOtpValidation.requestNewCodeIn")}
              <strong>
                {" "}
                {fallbackSeconds} {t("EmailOtpValidation.seconds")}
              </strong>
            </span>
          ) : (
            <GcdsLink
              style={{ textDecoration: "underline" }}
              onGcdsClick={handleResendCode}
            >
              {t("EmailOtpValidation.requestNewCode")}
            </GcdsLink>
          )}
        </GcdsText>
      </GcdsGrid>
    </GcdsContainer>
  );
}
