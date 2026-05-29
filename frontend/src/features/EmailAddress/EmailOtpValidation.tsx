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
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import SubmitButton from "../../components/Layout/SubmitButton";
import { useOtpExpiryCountdown } from "../../hooks/useOtpExpiryCountdown";

type EmailFormData = {
  emailAddress: string;
};

interface EmailOtpValidationProps {
  onSubmit: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  formData: EmailFormData;
  setFormData: (data: EmailFormData) => void;
  errorMessage?: string;
  userOtpValue: string;
  handleChange: (value: string) => void;
  requestOtpCode: () => Promise<void>;
  onBack: () => void | Promise<void>;
  isMaxAttemptsReached?: boolean;
  resetAttempts?: () => void;
  otpExpiry?: string | null;
}

export default function EmailOtpValidation({
  onSubmit,
  onCancel,
  formData,
  setFormData,
  errorMessage,
  userOtpValue,
  handleChange,
  requestOtpCode,
  onBack,
  isMaxAttemptsReached = false,
  resetAttempts,
  otpExpiry = null,
}: EmailOtpValidationProps) {
  const { language } = useParams();
  const { t } = useTranslation(["email", "verification", "common"]);

  const [localError, setLocalError] = useState("");
  const {
    fallbackSeconds,
    formattedCountdown,
    hasServerExpiry,
    isExpired,
    restartFallbackCountdown,
  } = useOtpExpiryCountdown(otpExpiry);

  const displayError = localError || errorMessage || "";

  const clearValues = () => {
    setFormData({ emailAddress: "" });
  };

  const handleInputChange = (e: CustomEvent<string>) => {
    const value = (e.target as HTMLInputElement).value;
    handleChange(value);
    setLocalError("");
  };

  const onSubmitHandler: React.FormEventHandler<HTMLFormElement> = async (
    ev,
  ) => {
    ev.preventDefault();
    await onSubmit();
  };

  const handleResendCode = async (ev: Event) => {
    ev.preventDefault();
    if (requestOtpCode) {
      await requestOtpCode();
      setLocalError("");
      restartFallbackCountdown();
      resetAttempts?.();
    }
  };

  return (
    <GcdsContainer role="main">
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
              {t("Verification.chooseDifferentMethod", { ns: "verification" })}
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
            <GcdsInput
              style={{ marginTop: "1.5rem" }}
              label={t("EmailOtpValidation.sixDigitCode")}
              id="verificationCode"
              inputId="verificationCode"
              name="verificationCode"
              type="text"
              autocomplete="one-time-code"
              validateOn="other"
              errorMessage={displayError}
              value={userOtpValue}
              onGcdsInput={handleInputChange}
              lang={language}
              size={18}
              maxlength={6}
              minlength={6}
              autoFocus
            />
          </form>

          <GcdsGrid columns="max-content max-content" gap="200">
            <SubmitButton
              currentLang={language ?? "en"}
              disabled={isMaxAttemptsReached}
              onGcdsClick={(ev) => {
                ev.preventDefault();
                void onSubmit();
              }}
            />
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
        </>
      )}

      <GcdsHeading tag="h2">
        {t("EmailOtpValidation.problemsWithCode")}
      </GcdsHeading>

      <GcdsText>
        <GcdsLink
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
          <GcdsLink onGcdsClick={handleResendCode}>
            {t("EmailOtpValidation.requestNewCode")}
          </GcdsLink>
        )}
      </GcdsText>
    </GcdsContainer>
  );
}
