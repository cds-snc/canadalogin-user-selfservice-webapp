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
import {
  PAGES,
  ServicesWithAccessInfoSectionInformation,
} from "../../../utils/constants.jsx";
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

  /**
   * Capitalizes the first letter of each word in a name.
   * Canadian naming conventions: First letter should be capitalized.
   */
  const capitalizeFirstLetter = (str) => {
    if (!str) return str;
    // Split by spaces, hyphens, and apostrophes, capitalize first letter of each part
    return str
      .split(/([\s'-])/) // Split while keeping delimiters
      .map((part) => {
        if (part.match(/^[\s'-]$/)) return part; // Keep delimiters as-is
        if (part.length === 0) return part;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join("");
  };

  /**
   * Validates and filters name input to only allow valid characters.
   * Canadian naming rules: Letters (including accented), spaces, hyphens, and apostrophes only.
   * No numbers or other symbols allowed.
   */
  const filterNameInput = (value) => {
    // Only allow: letters (including international/accented), spaces, hyphens, apostrophes
    const validCharRegex =
      /[a-zA-ZÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]/g;
    const filtered = value.match(validCharRegex)?.join("") || "";
    return capitalizeFirstLetter(filtered);
  };

  /**
   * Handle input event - blocks invalid characters immediately.
   * Filters input in real-time and updates state.
   */
  const handleInput = (e) => {
    const { name, value } = e.target;

    if (name === "givenName" || name === "familyName") {
      const filteredValue = filterNameInput(value);

      // For GCDS components with shadow DOM, update the internal input element
      // For regular inputs (like in tests), update the target directly
      const inputElement = e.target.shadowRoot?.activeElement || e.target;
      inputElement.value = filteredValue;

      onNameFormChange(name, filteredValue);

      if (setErrorCode) {
        setErrorCode("");
      }
    }
  };

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    await onNext();
  };

  console.log(nameFormData);

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
        information={ServicesWithAccessInfoSectionInformation.NAME}
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
            onInput={handleInput}
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
            onInput={handleInput}
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
