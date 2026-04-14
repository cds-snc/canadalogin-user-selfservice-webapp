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
import { useTranslation } from "react-i18next";

import { useParams } from "react-router";
import { FLOW_TYPES } from "../../../utils/constants";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type { OtpFactor } from "../../../types/hooks";

type CaughtApiError = { data?: { message?: string } };

const initialTime = 10;

interface OtpVerificationProps {
  userSelectedMfaFactor: OtpFactor;
  setUserOtpValue: (value: string) => void;
  userOtpValue: string;
  onBack: () => void;
  requestOtpCode: () => Promise<void | boolean>;
  validateOtpCode: (otpValue: string) => Promise<void>;
  setErrorCode: (errorCode: string) => void;
  errorMessage?: string;
  onCancel: () => void;
  showTryAnotherWay?: boolean;
}

export default function OtpVerification({
  userSelectedMfaFactor,
  setUserOtpValue,
  userOtpValue,
  onBack,
  requestOtpCode,
  validateOtpCode,
  setErrorCode,
  errorMessage,
  onCancel,
  showTryAnotherWay = true,
}: OtpVerificationProps) {
  const { language } = useParams();
  const [time, setTime] = useState(initialTime);
  const { t } = useTranslation(["verification", "common"]);

  const handleChange = (e: CustomEvent<string>) => {
    const value = (e.target as HTMLInputElement).value;
    setUserOtpValue(value);
  };

  const doSubmit = async () => {
    setErrorCode(""); // Clear any previous errors
    try {
      await validateOtpCode(userOtpValue);
    } catch (error) {
      // Handle validation errors
      const apiError = error as CaughtApiError;
      if (apiError?.data?.message) {
        setErrorCode(apiError.data.message);
      }
    }
  };

  const onSubmitHandler: React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    void doSubmit();
  };

  useEffect(() => {
    if (time <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time]);

  const userMfaType = userSelectedMfaFactor?.type;
  return (
    <GcdsContainer role="main">
      <GcdsContainer>
        <GcdsHeading tag="h1" lang={language}>
          {userMfaType === FLOW_TYPES.email
            ? t("Verification.checkYourEmail")
            : t("Verification.checkYourPhone")}
        </GcdsHeading>

        <GcdsText>
          {userMfaType === FLOW_TYPES.voice
            ? t("Verification.voiceCodeSent")
            : userMfaType === FLOW_TYPES.sms
              ? t("Verification.smsCodeSent")
              : t("Verification.emailCodeSent")}
          &nbsp;
          <strong>{userSelectedMfaFactor.destination}</strong>
        </GcdsText>
        <GcdsText>
          {userMfaType === FLOW_TYPES.voice
            ? t("Verification.callMayTakeMinutes")
            : userMfaType === FLOW_TYPES.sms
              ? t("Verification.smsMayTakeMinutes")
              : t("Verification.emailMayTakeMinutes")}
        </GcdsText>
        <GcdsText>
          {t("Verification.codeExpiresIn")}{" "}
          <strong>{t("Verification.tenMinutes")}</strong>
        </GcdsText>
        {userMfaType !== FLOW_TYPES.email && (
          <GcdsHeading tag="h2">{t("Verification.enterCode")}</GcdsHeading>
        )}

        <form onSubmit={onSubmitHandler}>
          <GcdsInput
            inputId="verificationCode"
            label={t("Verification.sixDigitCode")}
            name="verificationCode"
            type="text"
            validateOn="other"
            errorMessage={errorMessage}
            value={userOtpValue}
            onGcdsInput={handleChange}
            lang={language}
            size={18}
            maxlength={6}
            minlength={6}
            autocomplete="one-time-code"
            autoFocus
          ></GcdsInput>
        </form>

        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            disabled={userOtpValue.length < 6}
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
      </GcdsContainer>
      <GcdsHeading tag="h2">{t("Verification.problemsWithCode")}</GcdsHeading>

      {showTryAnotherWay && (
        <GcdsText>
          <GcdsLink
            role="button"
            onGcdsClick={() => {
              onBack();
            }}
          >
            {t("Verification.tryAnotherWay")}
          </GcdsLink>
        </GcdsText>
      )}

      <GcdsText>
        {time > 0 ? (
          <span>
            {t("Verification.requestNewCodeIn")}
            <strong>
              {" "}
              {time} {t("Verification.seconds")}
            </strong>
          </span>
        ) : (
          <GcdsLink
            role="button"
            onGcdsClick={() => {
              void requestOtpCode();
              setTime(initialTime);
              setErrorCode("");
              setUserOtpValue("");
            }}
          >
            {userMfaType !== FLOW_TYPES.email
              ? t("Verification.requestNewCode")
              : t("Verification.sendCodeAgain")}
          </GcdsLink>
        )}
      </GcdsText>
    </GcdsContainer>
  );
}
