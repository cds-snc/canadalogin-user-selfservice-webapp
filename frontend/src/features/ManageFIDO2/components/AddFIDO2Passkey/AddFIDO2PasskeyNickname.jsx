import { useParams } from "react-router";
import { getPageContent } from "../../../../utils/functions";
import { PAGES } from "../../../../utils/constants";
import { useState } from "react";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsText,
} from "@cdssnc/gcds-components-react";

export default function AddFIDO2PasskeyNickname({
  setErrorCode,
  errorMessage,
  onCancel,
  onSubmit,
  registrationLoading,
}) {
  const { language } = useParams();
  const pageContent = getPageContent(language, PAGES.addFIDO2PasskeyNickname);
  const [newDeviceName, setNewDeviceName] = useState("");

  const handleSubmit = async () => {
    if (!newDeviceName || newDeviceName.trim() === "") {
      setErrorCode("error_passkey_name_required");
      return;
    }
    await onSubmit(newDeviceName);
  };

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h1" lang={language}>
          {pageContent["1"]}
        </GcdsHeading>
        <GcdsText marginBottom="0">{pageContent["2"]}</GcdsText>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleSubmit();
          }}
        >
          <GcdsInput
            errorMessage={errorMessage}
            inputId="passkey-name"
            label={pageContent["3"]}
            value={newDeviceName}
            onGcdsInput={(e) => setNewDeviceName(e.target.value)}
            hint={pageContent["4"]}
            required={true}
          />
        </form>
        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            onClick={async (e) => {
              e.preventDefault();
              await handleSubmit();
            }}
            disabled={registrationLoading}
          >
            {pageContent["5"]}
          </GcdsButton>
          <GcdsButton
            buttonRole="secondary"
            onClick={onCancel}
            disabled={registrationLoading}
          >
            {pageContent["6"]}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
