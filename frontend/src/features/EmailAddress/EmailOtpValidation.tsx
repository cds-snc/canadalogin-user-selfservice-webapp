import { useEffect, useRef, useState } from "react";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";
import { PAGES } from "../../utils/constants";
import { getPageContent } from "../../utils/functions";
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
  const pageContentJson = getPageContent(language, PAGES.emailOtpValidation)!;
  const { cancel } = getPageContent(language, "Button")!;
  const didFetch = useRef(false);

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

  // Automatically request OTP when component mounts
  useEffect(() => {
    if (!didFetch.current && requestOtpCode) {
      didFetch.current = true;
      void requestOtpCode();
    }
  }, [requestOtpCode]);

  // Countdown timer for resend button
  useEffect(() => {
    if (time <= 0) return;

    const timer = setTimeout(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time]);

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1" lang={language}>
        {pageContentJson["1"]}
      </GcdsHeading>

      <GcdsText>
        {pageContentJson["2"]} <strong>{formData.emailAddress}</strong>
      </GcdsText>

      <GcdsText>{pageContentJson["3"]}</GcdsText>

      <GcdsText>{pageContentJson["4"]}</GcdsText>

      <form onSubmit={onSubmitHandler}>
        <GcdsInput
          style={{ marginTop: "1.5rem" }}
          label={pageContentJson["6"]}
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
          size={6}
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
          {cancel}
        </GcdsButton>
      </GcdsGrid>

      <GcdsHeading tag="h2">{pageContentJson["7"]}</GcdsHeading>

      <GcdsText>
        <GcdsLink
          onGcdsClick={async () => {
            clearValues();
            await onBack();
          }}
        >
          {pageContentJson["8"]}
        </GcdsLink>
      </GcdsText>

      <GcdsText>
        {time > 0 ? (
          <span>
            {pageContentJson["9"]}
            <strong>
              {" "}
              {time} {pageContentJson["10"]}
            </strong>
          </span>
        ) : (
          <GcdsLink onGcdsClick={handleResendCode}>
            {pageContentJson["11"]}
          </GcdsLink>
        )}
      </GcdsText>
    </GcdsContainer>
  );
}
