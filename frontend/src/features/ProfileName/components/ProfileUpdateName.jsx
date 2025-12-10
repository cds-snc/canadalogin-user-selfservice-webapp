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

  const validateNameInput = (value) => {
    // Allow alphabetical characters, spaces, hyphens, and apostrophes
    // This regex allows Unicode letters to support international names
    const nameRegex =
      /^[a-zA-ZÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]*$/;
    return nameRegex.test(value);
  };

  const validateCharacter = (char) => {
    // Check if a single character is valid for names
    const charRegex =
      /[a-zA-ZÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]/;
    return charRegex.test(char);
  };

  const handleKeyDown = (e) => {
    const { name } = e.target;
    const char = e.key;

    // Only apply validation to name fields
    if (name === "givenName" || name === "familyName") {
      // Allow control keys (backspace, delete, tab, etc.)
      if (e.ctrlKey || e.metaKey || char.length > 1) {
        return;
      }

      // Prevent invalid characters from being typed
      if (!validateCharacter(char)) {
        e.preventDefault();
      }
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    // Additional validation as fallback
    if (
      (name === "givenName" || name === "familyName") &&
      !validateNameInput(value)
    ) {
      // Prevent invalid characters from being entered
      return;
    }

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
    <GcdsContainer role="main">
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
            onKeyDown={handleKeyDown}
            pattern="[a-zA-ZÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]*"
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
            onKeyDown={handleKeyDown}
            pattern="[a-zA-ZÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]*"
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
