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

const initialTime = 10;
import { ChangeEvent, FormEvent } from "react";

type EmailOtpValidationProps = {
  onSubmit: () => Promise<void> | void;
  onCancel: () => void;
  formData: { emailAddress?: string };
  setFormData: (f: { emailAddress?: string }) => void;
  errorMessage?: string | null;
  userOtpValue?: string;
  handleChange: (value: string) => void;
  requestOtpCode?: () => Promise<void> | void;
  onBack: () => void;
};

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
  const pageContentJson = getPageContent(language, PAGES.emailOtpValidation);
  const { cancel } = getPageContent(language, "Button");
  const didFetch = useRef(false);

  const [time, setTime] = useState(initialTime);

  const clearValues = () => {
    setFormData({ emailAddress: "" });
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleChange(value);
  };

  const onSubmitHandler = async (ev: FormEvent) => {
    ev.preventDefault();
    await onSubmit();
  };

  const handleResendCode = async (ev: FormEvent) => {
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
      requestOtpCode();
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
          name="verificationCode"
          type="text"
          autocomplete="one-time-code"
          validateOn="other"
          errorMessage={errorMessage}
          value={userOtpValue}
          onGcdsInput={handleInputChange}
          lang={language}
          size="6"
          maxlength={6}
          minlength={6}
          autofocus
        />
      </form>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton onGcdsClick={onSubmitHandler} />
        <GcdsButton
          buttonRole="secondary"
          onGcdsClick={(ev) => {
            ev.preventDefault();
            onCancel();
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
            onBack();
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
