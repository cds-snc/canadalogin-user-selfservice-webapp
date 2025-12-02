import React from "react";
import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsText,
  GcdsErrorMessage,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions.jsx";
import { PAGES } from "../../../utils/constants.jsx";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection.jsx";

export default function ProfileUpdateName({
  nameFormData,
  onNameFormChange,
  onNext,
  onCancel,
  errorMessage,
  setErrorCode,
}) {
  const { language } = useParams();
  const pageNameEditJson = getPageContent(language, PAGES.profileUpdateName);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    onNameFormChange(name, value);
    // Clear error when user starts typing
    if (setErrorCode) {
      setErrorCode("");
    }
  };

  const useSubmitHandler = (event) => {
    event.preventDefault();
    onNext();
  };

  return (
    <GcdsContainer>
      {errorMessage && (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      )}

      <GcdsHeading tag="h1">{pageNameEditJson["5"]}</GcdsHeading>

      <GcdsText>
        {pageNameEditJson["6"]} <strong>{pageNameEditJson["7"]}</strong>
      </GcdsText>

      <ServicesWithAccessInfoSection
        currentLang={language}
        information={"name"}
      />

      <form id="form" style={{ marginTop: "38px" }} onSubmit={useSubmitHandler}>
        <GcdsContainer marginTop="100" marginBottom="0">
          <GcdsInput
            inputId="givenName"
            label={pageNameEditJson["2"]}
            name="givenName"
            type="text"
            validateOn="other"
            data-testid="givenName"
            lang={language}
            value={nameFormData.givenName}
            onChange={handleProfileChange}
          />
          <GcdsInput
            inputId="familyName"
            label={pageNameEditJson["3"]}
            name="familyName"
            type="text"
            validateOn="other"
            data-testid="familyName"
            lang={language}
            required
            value={nameFormData.familyName}
            onChange={handleProfileChange}
          />
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            currentLang={language}
            disabled={false}
            onGcdsClick={useSubmitHandler}
          />
          <GcdsButton
            buttonRole="secondary"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              onCancel();
            }}
          >
            {pageNameEditJson["4"]}
          </GcdsButton>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}
