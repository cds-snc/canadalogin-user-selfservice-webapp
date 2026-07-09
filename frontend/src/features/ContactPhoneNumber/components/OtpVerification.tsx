import type { FormEventHandler } from "react";
import { useState } from "react";

import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";

import { useParams } from "react-router";
import { FLOW_TYPES } from "../../../utils/constants";
import { handleLinkButtonKeyDown } from "../../../utils/accessibility";
import SubmitButton from "../../../components/Layout/SubmitButton";
import { useOtpExpiryCountdown } from "../../../hooks/useOtpExpiryCountdown";
import type {
  ContactPhoneOtpType,
  ContactPhoneOtpVerificationProps,
} from "../../../types/contactPhoneNumber";

interface PageHeaderProps {
  language: string;
  userMfaType: ContactPhoneOtpType;
  formattedPhoneNumber: string;
  countdownDisplay: string;
}

function PageHeader({
  language,
  userMfaType,
  formattedPhoneNumber,
  countdownDisplay,
}: PageHeaderProps) {
  const { t } = useTranslation("verification");
  return (
    <>
      <GcdsHeading tag="h1" lang={language}>
        {t("Verification.checkYourPhone")}
      </GcdsHeading>
      <GcdsText marginBottom="0">
        {userMfaType === FLOW_TYPES.sms
          ? t("Verification.smsCodeSent")
          : t("Verification.voiceCodeSent")}
      </GcdsText>
      <GcdsText marginTop="0">
        <strong>{formattedPhoneNumber}</strong>
      </GcdsText>
      <GcdsText>
        {userMfaType === FLOW_TYPES.voice
          ? t("Verification.callMayTakeMinutes")
          : t("Verification.smsMayTakeMinutes")}
      </GcdsText>
      <GcdsText>
        {t("Verification.codeExpiresIn")} <strong>{countdownDisplay}</strong>
      </GcdsText>
    </>
  );
}

export default function OtpVerification({
  onNext,
  onCancel,
  onBack,
  onChangePhoneForm,
  phoneFormData,
  errorMessage,
  requestNewOtpCode,
  setErrorCode,
  isMaxAttemptsReached = false,
  resetAttempts,
}: ContactPhoneOtpVerificationProps) {
  const { language = "en" } = useParams<{ language: string }>();

  const [codeRequested, setCodeRequested] = useState(false);
  const { t } = useTranslation(["verification", "common"]);
  const [localError, setLocalError] = useState("");
  const {
    fallbackSeconds,
    formattedCountdown,
    hasServerExpiry,
    isExpired,
    restartFallbackCountdown,
  } = useOtpExpiryCountdown(phoneFormData.expiry);

  const displayError = localError || errorMessage || "";

  const clearValues = () => {
    onChangePhoneForm("phoneNumber", "");
    onChangePhoneForm("formattedPhoneNumber", "");
    onChangePhoneForm("otp", "");
    setCodeRequested(false);
  };

  const requestNewCode = async (otpType?: ContactPhoneOtpType) => {
    onChangePhoneForm("otp", "");
    await requestNewOtpCode(otpType ?? phoneFormData.otpType);
    setCodeRequested(true);
    setLocalError("");
    restartFallbackCountdown();
    resetAttempts?.();
  };

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    onChangePhoneForm("otp", target.value);
    setCodeRequested(false);
    setErrorCode?.("");
    setLocalError("");
  };

  const onSubmitHandler: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    await onNext();
  };

  const onSubmitClick = (event: CustomEvent<string | void>) => {
    event.preventDefault();
    void onNext();
  };

  const userMfaType = phoneFormData.otpType;

  const switchVerificationMethod = () => {
    const newOtpType =
      userMfaType === FLOW_TYPES.sms ? FLOW_TYPES.voice : FLOW_TYPES.sms;
    onChangePhoneForm("otpType", newOtpType);
    void requestNewCode(newOtpType);
  };

  const requestNewCodeAction = () => {
    void requestNewCode();
  };

  const tryAnotherWayAction = () => {
    clearValues();
    void onBack();
  };

  return (
    <GcdsContainer role="main">
      {codeRequested ? (
        <GcdsNotice
          noticeRole="success"
          noticeTitleTag="h2"
          noticeTitle={t("Verification.newCodeSent")}
          data-testid="linkSuccess"
        >
          &nbsp;
        </GcdsNotice>
      ) : null}

      <GcdsContainer>
        <PageHeader
          language={language}
          userMfaType={userMfaType}
          formattedPhoneNumber={phoneFormData.formattedPhoneNumber}
          countdownDisplay={
            hasServerExpiry ? formattedCountdown : t("Verification.tenMinutes")
          }
        />

        {isExpired ? (
          <>
            <GcdsText>{t("Verification.expiredMessage")}</GcdsText>

            <GcdsGrid columns="max-content max-content" gap="200">
              <GcdsButton
                style={{ width: "fit-content" }}
                onGcdsClick={(event: Event) => {
                  event.preventDefault();
                  void requestNewCode();
                }}
              >
                {t("Verification.requestNewCode")}
              </GcdsButton>

              <GcdsButton
                buttonRole="secondary"
                style={{ width: "fit-content" }}
                onGcdsClick={(event: Event) => {
                  event.preventDefault();
                  const newOtpType =
                    userMfaType === FLOW_TYPES.sms
                      ? FLOW_TYPES.voice
                      : FLOW_TYPES.sms;
                  onChangePhoneForm("otpType", newOtpType);
                  void requestNewCode(newOtpType);
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
                value={phoneFormData.otp}
                validateOn="other"
                errorMessage={displayError}
                onGcdsInput={handleChange}
                lang={language}
                size={18}
                maxlength={6}
                minlength={6}
              />
            </form>

            <GcdsGrid columns="max-content max-content" gap="200">
              <SubmitButton
                disabled={phoneFormData.otp.length < 6 || isMaxAttemptsReached}
                style={{ width: "fit-content" }}
                onGcdsClick={onSubmitClick}
                currentLang={language}
              />

              <GcdsButton
                buttonRole="secondary"
                style={{ width: "fit-content" }}
                onGcdsClick={(event: Event) => {
                  event.preventDefault();
                  void onCancel();
                }}
              >
                {t("Button.cancel", { ns: "common" })}
              </GcdsButton>
            </GcdsGrid>
          </>
        )}
      </GcdsContainer>
      <GcdsHeading tag="h2">{t("Verification.problemsWithCode")}</GcdsHeading>

      <GcdsText>
        <GcdsLink
          role="button"
          onGcdsClick={switchVerificationMethod}
          onKeyDown={(event) =>
            handleLinkButtonKeyDown(event, switchVerificationMethod)
          }
        >
          {userMfaType === FLOW_TYPES.sms
            ? t("Verification.setupVoiceInstead")
            : t("Verification.setupSmsInstead")}
        </GcdsLink>
      </GcdsText>

      <GcdsText>
        {!isExpired && fallbackSeconds > 0 ? (
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
            onGcdsClick={requestNewCodeAction}
            onKeyDown={(event) =>
              handleLinkButtonKeyDown(event, requestNewCodeAction)
            }
          >
            {t("Verification.requestNewCode")}
          </GcdsLink>
        )}
      </GcdsText>

      <GcdsText>
        <GcdsLink
          role="button"
          onGcdsClick={tryAnotherWayAction}
          onKeyDown={(event) =>
            handleLinkButtonKeyDown(event, tryAnotherWayAction)
          }
        >
          {t("Verification.tryAnotherWay")}
        </GcdsLink>
      </GcdsText>
    </GcdsContainer>
  );
}
