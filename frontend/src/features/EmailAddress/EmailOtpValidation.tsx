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
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import SubmitButton from "../../components/Layout/SubmitButton";

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
}

const initialTime = 10;

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
}: EmailOtpValidationProps) {
  const { language } = useParams();
  const { t } = useTranslation(["email", "common"]);

  const [time, setTime] = useState(initialTime);

  const clearValues = () => {
    setFormData({ emailAddress: "" });
  };

  const handleInputChange = (e: CustomEvent<string>) => {
    const value = (e.target as HTMLInputElement).value;
    handleChange(value);
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
      setTime(initialTime); // Reset timer
    }
  };

  // Countdown timer for resend button
  useEffect(() => {
    if (time <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time]);

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1" lang={language}>
        {t("EmailOtpValidation.title")}
      </GcdsHeading>

      <GcdsText>
        {t("EmailOtpValidation.codeSent")}{" "}
        <strong>{formData.emailAddress}</strong>
      </GcdsText>

      <GcdsText>{t("EmailOtpValidation.emailMayTakeMinutes")}</GcdsText>

      <GcdsText>{t("EmailOtpValidation.codeExpiresIn")}</GcdsText>

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
          errorMessage={errorMessage}
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
        {time > 0 ? (
          <span>
            {t("EmailOtpValidation.requestNewCodeIn")}
            <strong>
              {" "}
              {time} {t("EmailOtpValidation.seconds")}
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
