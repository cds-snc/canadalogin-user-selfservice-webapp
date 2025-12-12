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

  const validateCharacter = (char) => {
    // Check if a single character is valid for names
    const charRegex =
      /[a-zA-ZÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]/;
    return charRegex.test(char);
  };

  const handleKeyUp = (e) => {
    const { name } = e.target;
    const char = e.key;

    // Only apply validation to name fields
    if (name === "givenName" || name === "familyName") {
      // Prevent invalid characters from being typed
      if (!validateCharacter(char)) {
        e.preventDefault();
        return;
      }
      handleProfileChange(e);
    }
  };

  // onChange handler with validation for paste operations, etc.
  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    // Apply validation to name fields
    if (name === "givenName" || name === "familyName") {
      // Filter out invalid characters from pasted content
      const validCharRegex =
        /[a-zA-ZÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]/g;
      const filteredValue = value.match(validCharRegex)?.join("") || "";

      // Only update if the filtered value is different from original
      if (filteredValue !== value) {
        // Set the filtered value back to the input
        e.target.value = filteredValue;
        onNameFormChange(name, filteredValue);
      } else {
        onNameFormChange(name, value);
      }
    } else {
      onNameFormChange(name, value);
    }

    if (setErrorCode) {
      setErrorCode("");
    }
  };

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    await onNext();
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
      <form onSubmit={onSubmitHandler}>
        <GcdsContainer style={{ marginTop: "1.5rem" }}>
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
            onKeyUp={handleKeyUp}
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
            onKeyUp={handleKeyUp}
            pattern="[a-zA-ZÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]*"
          />
        </GcdsContainer>
      </form>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          currentLang={language}
          disabled={false}
          onGcdsClick={onSubmitHandler}
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
    </GcdsContainer>
  );
}
