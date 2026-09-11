import { useEffect, useState } from "react";

import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsText,
} from "@gcds-core/components-react";

import AccessibleNotice from "../../../../components/InfoBlocks/AccessibleNotice";
import { useParams } from "react-router";
import { FLOW_TYPES } from "../../../../utils/constants";
import { useTranslation } from "react-i18next";
import SubmitButton from "../../../../components/Layout/SubmitButton";
import { useBreakpoints } from "../../../../hooks/useBreakpoints";
import { useOtpExpiryCountdown } from "../../../../hooks/useOtpExpiryCountdown";
import EmailNotificationInfoNotice from "../../../../components/InfoBlocks/EmailNotificationInfoNotice";

interface PageHeaderProps {
  language: string | undefined;
  userMfaType: string;
  formattedPhoneNumber: string;
  countdownDisplay: string;
}

const PageHeader = ({
  language,
  userMfaType,
  formattedPhoneNumber,
  countdownDisplay,
}: PageHeaderProps) => {
  const { t } = useTranslation("verification");
  const sentMessage =
    userMfaType === FLOW_TYPES.sms
      ? t("Verification.smsCodeSent")
      : t("Verification.voiceCodeSent");

  return (
    <>
      <GcdsHeading tag="h1" lang={language}>
        {t("Verification.checkYourPhone")}
      </GcdsHeading>
      <GcdsText>
        {sentMessage} <strong>{formattedPhoneNumber}</strong>.
      </GcdsText>
      <GcdsText>
        {userMfaType === FLOW_TYPES.voice
          ? t("Verification.callMayTakeMinutes")
          : userMfaType === FLOW_TYPES.sms
            ? t("Verification.smsMayTakeMinutes")
            : t("Verification.emailMayTakeMinutes")}
      </GcdsText>
      <GcdsText>
        {t("Verification.codeExpiresIn")} <strong>{countdownDisplay}</strong>
      </GcdsText>
    </>
  );
};

interface PhoneFormData {
  phoneNumber: string;
  otp: string;
  mfaId: string;
  trxnId: string;
  expiry: string;
  created?: string;
  otpType: string;
  formattedPhoneNumber: string;
}

const OTP_CODE_MAX_LENGTH = 6;

interface AddMFAOtpVerificationProps {
  onNext: () => Promise<void>;
  onCancel: () => Promise<void>;
  onBack: () => Promise<void>;
  onChangePhoneForm: (field: string, value: string) => void;
  phoneFormData: PhoneFormData;
  errorMessage: string;
  setErrorCode?: (errorCode: string) => void;
  setErrorMessage?: (errorMessage: string) => void;
  requestNewOtpCode: () => Promise<void | boolean>;
  onUseDifferentPhoneNumber: () => Promise<void>;
  onSetupAlternateMFAMethod: () => Promise<void>;
  isMaxAttemptsReached?: boolean;
  resetAttempts?: () => void;
}

export default function AddMFAOtpVerification({
  onNext,
  onCancel,
  onBack,
  onChangePhoneForm,
  phoneFormData,
  errorMessage,
  setErrorCode,
  setErrorMessage,
  requestNewOtpCode,
  onUseDifferentPhoneNumber,
  onSetupAlternateMFAMethod,
  isMaxAttemptsReached: _isMaxAttemptsReached = false,
  resetAttempts,
}: AddMFAOtpVerificationProps) {
  const { language } = useParams();

  const [codeRequested, setCodeRequested] = useState(false);
  const { t } = useTranslation(["verification", "common"]);
  const { mobile } = useBreakpoints();
  const [localError, setLocalError] = useState("");
  const {
    fallbackSeconds,
    formattedCountdown,
    hasServerExpiry,
    isExpired,
    restartFallbackCountdown,
  } = useOtpExpiryCountdown(phoneFormData.expiry, 10, phoneFormData.created);

  const displayError = localError || errorMessage || "";
  const shouldShowSuccessNotice = codeRequested && !displayError;
  const otpInputSize = mobile ? 18 : 6;

  const clearValues = () => {
    onChangePhoneForm("phoneNumber", "");
    onChangePhoneForm("formattedPhoneNumber", "");
    onChangePhoneForm("otp", "");
    setCodeRequested(false);
  };

  const handleChange = (e: CustomEvent<string>) => {
    const value = (e.target as HTMLInputElement).value;
    const sanitizedValue = value
      .replace(/\D/g, "")
      .slice(0, OTP_CODE_MAX_LENGTH);
    onChangePhoneForm("otp", sanitizedValue);
  };

  // Clear OTP field on mount
  useEffect(() => {
    onChangePhoneForm("otp", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userMfaType = phoneFormData.otpType;

  const doSubmit = async () => {
    setLocalError("");
    setErrorCode?.("");
    setErrorMessage?.("");

    const normalizedOtp = phoneFormData.otp
      .replace(/\D/g, "")
      .slice(0, OTP_CODE_MAX_LENGTH);
    if (normalizedOtp.length < OTP_CODE_MAX_LENGTH) {
      const invalidCodeMessage = t("Error.invalidCode", { ns: "common" });
      setLocalError(invalidCodeMessage);
      setErrorMessage?.(invalidCodeMessage);
      setErrorCode?.("invalidCode");
      return;
    }

    await onNext();
  };

  const onSubmitHandler: React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    void doSubmit();
  };

  const handleRequestNewCode = async () => {
    const requestSucceeded = await requestNewOtpCode();

    if (requestSucceeded === false) {
      setCodeRequested(false);
      return;
    }

    setErrorCode?.("");
    setErrorMessage?.("");
    onChangePhoneForm("otp", "");
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
      <GcdsGrid columns="1" gap="300">
        {shouldShowSuccessNotice && (
          <AccessibleNotice
            noticeRole="success"
            noticeTitleTag="h2"
            noticeTitle={t("Verification.successTitle")}
            data-testid="linkSuccess"
          >
            <GcdsText>{t("Verification.newCodeSent")}</GcdsText>
          </AccessibleNotice>
        )}

        <GcdsContainer>
          <PageHeader
            language={language}
            userMfaType={userMfaType}
            formattedPhoneNumber={phoneFormData.formattedPhoneNumber}
            countdownDisplay={
              hasServerExpiry
                ? formattedCountdown
                : t("Verification.tenMinutes")
            }
          />

          {isExpired ? (
            <>
              <GcdsText>{t("Verification.expiredMessage")}</GcdsText>

              <GcdsGrid columns="max-content max-content" gap="200">
                <GcdsButton
                  style={{ width: "fit-content" }}
                  onGcdsClick={(ev) => {
                    ev.preventDefault();
                    void handleRequestNewCode();
                  }}
                >
                  {t("Verification.requestNewCode")}
                </GcdsButton>

                <GcdsButton
                  buttonRole="secondary"
                  style={{ width: "fit-content" }}
                  onGcdsClick={(ev) => {
                    ev.preventDefault();
                    void onSetupAlternateMFAMethod();
                  }}
                >
                  {t("Verification.chooseDifferentMethod")}
                </GcdsButton>
              </GcdsGrid>
            </>
          ) : (
            <>
              <GcdsHeading tag="h2">{t("Verification.enterCode")}</GcdsHeading>
              <form onSubmit={onSubmitHandler}>
                <GcdsInput
                  inputId="verificationCode"
                  label={t("Verification.sixDigitCode")}
                  autoFocus
                  autocomplete="one-time-code"
                  name="verificationCode"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength={OTP_CODE_MAX_LENGTH}
                  value={phoneFormData.otp}
                  validateOn="other"
                  errorMessage={displayError}
                  onGcdsInput={handleChange}
                  lang={language}
                  size={otpInputSize}
                ></GcdsInput>
              </form>

              <EmailNotificationInfoNotice
                title={t("Verification.addPhoneInfoTitle")}
                description={t("Verification.addPhoneInfoDescription")}
                lang={language}
              />
            </>
          )}
        </GcdsContainer>

        {!isExpired ? (
          <GcdsGrid columns="max-content max-content" gap="200">
            <SubmitButton
              style={{ width: "fit-content" }}
              onGcdsClick={(ev) => {
                ev.preventDefault();
                void doSubmit();
              }}
              currentLang={language ?? "en"}
            ></SubmitButton>

            <GcdsButton
              buttonRole="secondary"
              style={{ width: "fit-content" }}
              onGcdsClick={(ev) => {
                ev.preventDefault();
                onCancel();
              }}
            >
              {t("Button.cancel", { ns: "common" })}
            </GcdsButton>
          </GcdsGrid>
        ) : null}

        <GcdsContainer>
          <GcdsHeading tag="h2">
            {t("Verification.problemsWithCode")}
          </GcdsHeading>

          <GcdsText>
            <GcdsLink
              style={{ textDecoration: "underline" }}
              onGcdsClick={async () => {
                await onSetupAlternateMFAMethod();
              }}
            >
              {userMfaType === FLOW_TYPES.sms
                ? t("Verification.setupVoiceInstead")
                : t("Verification.setupSmsInstead")}
            </GcdsLink>
          </GcdsText>

          <GcdsText>
            {!isExpired && fallbackSeconds > 0 ? (
              <span>
                {t("Verification.requestNewCodeAvailableIn")}
                <strong>
                  {" "}
                  {fallbackSeconds} {t("Verification.seconds")}
                </strong>
              </span>
            ) : (
              <GcdsLink
                style={{ textDecoration: "underline" }}
                onGcdsClick={requestNewCodeAction}
              >
                {userMfaType !== FLOW_TYPES.email
                  ? t("Verification.requestNewCode")
                  : t("Verification.sendCodeAgain")}
              </GcdsLink>
            )}
          </GcdsText>

          <GcdsText>
            <GcdsLink
              style={{ textDecoration: "underline" }}
              onGcdsClick={async () => {
                clearValues();
                await onUseDifferentPhoneNumber();
                onBack();
              }}
            >
              {t("Verification.differentPhoneNumber")}
            </GcdsLink>
          </GcdsText>
        </GcdsContainer>
      </GcdsGrid>
    </GcdsContainer>
  );
}
