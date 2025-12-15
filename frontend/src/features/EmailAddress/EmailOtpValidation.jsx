import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";
import { PAGES } from "../../utils/constants";
import { getPageContent } from "../../utils/functions";
import SubmitButton from "../../components/Layout/SubmitButton";

export default function EmailOtpValidation({
  onSubmit,
  onCancel,
  formData,
  errorMessage,
  userOtpValue,
  handleChange,
}) {
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.emailOtpValidation);
  const { cancel } = getPageContent(language, "Button");

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    await onSubmit();
  };

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1" lang={language}>
        {pageContentJson["1"]}
      </GcdsHeading>

      <GcdsText>
        {pageContentJson["2"]} {formData.emailAddress}
      </GcdsText>

      <GcdsText>{pageContentJson["3"]}</GcdsText>

      <GcdsText>{pageContentJson["4"]}</GcdsText>

      <form>
        <GcdsInput
          style={{ marginTop: "1.5rem" }}
          label={pageContentJson["6"]}
          id="otpCode"
          name="otpCode"
          type="text"
          autocomplete="one-time-code"
          validateOn="other"
          errorMessage={errorMessage}
          value={userOtpValue}
          onGcdsInput={handleChange}
          lang={language}
          size="6"
          maxlength={6}
          minlength={6}
          required={errorMessage === ""}
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
    </GcdsContainer>
  );
}
