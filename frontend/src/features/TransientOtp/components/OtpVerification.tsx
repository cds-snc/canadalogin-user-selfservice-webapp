import { useEffect, useState } from "react";

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
import SubmitButton from "../../../components/Layout/SubmitButton";
import type { OtpFactor } from "../../../types/hooks";

type CaughtApiError = {
  data?: { message?: string; retries?: number; attempts?: number };
};

const initialTime = 10;

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
}: OtpVerificationProps) {
  const { language } = useParams();
  const [time, setTime] = useState(initialTime);
  const [codeRequested, setCodeRequested] = useState(false);
  const { t } = useTranslation(["verification", "common"]);
  const [localError, setLocalError] = useState("");
  const [isMaxAttemptsReached, setIsMaxAttemptsReached] = useState(false);

  const displayError = localError || errorMessage || "";

  const handleChange = (e: CustomEvent<string>) => {
    const value = (e.target as HTMLInputElement).value;
    setUserOtpValue(value);
  };

  const doSubmit = async () => {
    if (!/^\d{6}$/.test(userOtpValue)) {
      setLocalError(t("Error.invalidCode", { ns: "common" }));
      return;
    }
    setLocalError("");
    setErrorCode("");
    setErrorMessage?.("");
    try {
      await validateOtpCode(userOtpValue);
    } catch (error) {
      const apiError = error as CaughtApiError;
      const messageId = apiError?.data?.message;
      const retries = apiError?.data?.retries;
      const attempts = apiError?.data?.attempts;

      if (
        retries !== undefined &&
        retries !== null &&
        attempts !== undefined &&
        attempts !== null
      ) {
        // The backend enriches the error with retries (max allowed) and
        // attempts (used so far) from the IBM Verify retrieve endpoint.
        const remaining = retries - attempts;

        if (remaining <= 0) {
          const maxAttemptsMsg = t("Error.otp_max_attempts", { ns: "common" });
          setIsMaxAttemptsReached(true);
          setLocalError(maxAttemptsMsg);
          setErrorMessage?.(maxAttemptsMsg);
        } else {
          const invalidAttemptsMsg = t("Error.otp_invalid_attempts", {
            ns: "common",
            count: remaining,
          });
          setLocalError(invalidAttemptsMsg);
          setErrorMessage?.(invalidAttemptsMsg);
        }
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
      {codeRequested ? (
        <GcdsNotice
          noticeRole="success"
          noticeTitleTag="h2"
          noticeTitle={t("Verification.successTitle")}
          data-testid="linkSuccess"
        >
          <GcdsText>{t("Verification.newCodeSent")}</GcdsText>
        </GcdsNotice>
      ) : null}

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
            errorMessage={displayError}
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

        <GcdsGrid
          columns={
            showTryAnotherWay ? "max-content max-content" : "max-content"
          }
          gap="200"
        >
          <SubmitButton
            disabled={userOtpValue.length < 6 || isMaxAttemptsReached}
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
          ) : null}
        </GcdsGrid>
      </GcdsContainer>
      <GcdsHeading tag="h2">{t("Verification.problemsWithCode")}</GcdsHeading>

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
              void (async () => {
                const requestSucceeded = await requestOtpCode();

                if (requestSucceeded === false) {
                  setCodeRequested(false);
                  return;
                }

                setCodeRequested(true);
                setTime(initialTime);
                setErrorCode("");
                setErrorMessage?.("");
                setUserOtpValue("");
                setLocalError("");
                setIsMaxAttemptsReached(false);
              })();
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
