import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";

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

function handleLinkButtonKeyDown(event: KeyboardEvent, action: () => void) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  action();
}

function getRemainingSeconds(expiry?: string | null): number | null {
  if (!expiry) {
    return null;
  }

  const expiryMs = new Date(expiry).getTime();
  if (Number.isNaN(expiryMs)) {
    return null;
  }

  const remainingMs = expiryMs - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

function formatMinutesAndSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

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
  onCancel,
}: OtpVerificationProps) {
  const { language } = useParams();
  const [time, setTime] = useState(initialTime);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() =>
    getRemainingSeconds(otpExpiry),
  );
  const [codeRequested, setCodeRequested] = useState(false);
  const { t } = useTranslation(["verification", "common"]);
  const [localError, setLocalError] = useState("");
  const [isMaxAttemptsReached, setIsMaxAttemptsReached] = useState(false);

  const displayError = localError || errorMessage || "";
  const hasServerExpiry = remainingSeconds !== null;
  const isOtpExpired = hasServerExpiry && remainingSeconds <= 0;
  const countdownDisplay =
    hasServerExpiry && remainingSeconds !== null
      ? formatMinutesAndSeconds(remainingSeconds)
      : null;

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
    setRemainingSeconds(getRemainingSeconds(otpExpiry));
  }, [otpExpiry]);

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setRemainingSeconds(getRemainingSeconds(otpExpiry));
    }, 1000);

    return () => clearTimeout(timer);
  }, [otpExpiry, remainingSeconds]);

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
  const isEmailFactor =
    userMfaType === FLOW_TYPES.email || userMfaType === FLOW_TYPES.emailOtp;

  const handleRequestNewCode = async () => {
    const requestSucceeded = await requestOtpCode();

    if (requestSucceeded === false) {
      setCodeRequested(false);
      return;
    }

    setCodeRequested(true);
    setTime(initialTime);
    setErrorCode("");
    setUserOtpValue("");
    setLocalError("");
    resetAttempts?.();
  };

  const requestNewCodeAction = () => {
    void handleRequestNewCode();
  };

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
                showTryAnotherWay ? "max-content" : "max-content max-content"
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
        {!isOtpExpired && time > 0 ? (
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
