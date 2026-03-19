import type { FormEventHandler } from "react";
import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsText,
} from "@gcds-core/components-react";

import { getPageContent } from "../../../utils/functions";
import {
  PAGES,
  ServicesWithAccessInfoSectionInformation,
} from "../../../utils/constants";
import SubmitButton from "../../../components/Layout/SubmitButton";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection";
import type {
  EditableProfileNameField,
  ProfileNameEditProps,
  ProfileNamePageContent,
} from "../../../types/profileName";

type NameInputTarget = EventTarget & {
  name?: string;
  value?: string;
  shadowRoot?: ShadowRoot | null;
};

function isEditableProfileNameField(
  value?: string,
): value is EditableProfileNameField {
  return value === "givenName" || value === "familyName";
}

function capitalizeFirstLetter(value: string): string {
  if (!value) {
    return value;
  }

  return value
    .split(/([\s'-])/)
    .map((part) => {
      if (/^[\s'-]$/.test(part) || part.length === 0) {
        return part;
      }

      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

function filterNameInput(value: string): string {
  const validCharRegex =
    /[a-zA-ZÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]/g;
  const filtered = value.match(validCharRegex)?.join("") || "";
  return capitalizeFirstLetter(filtered);
}

function syncInputValue(target: NameInputTarget | null, value: string) {
  const activeElement = target?.shadowRoot?.activeElement;
  if (activeElement instanceof HTMLInputElement) {
    activeElement.value = value;
    return;
  }

  if (target && "value" in target) {
    target.value = value;
  }
}

export default function ProfileUpdateName({
  nameFormData,
  onNameFormChange,
  onNext,
  onCancel,
  errorMessage,
  setErrorCode,
}: ProfileNameEditProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";
  const pageNameEditJson =
    (getPageContent(routeLanguage, PAGES.profileUpdateName) as
      | ProfileNamePageContent
      | undefined) ?? {};

  const applyNameInput = (
    field: EditableProfileNameField,
    value: string,
    target?: NameInputTarget | null,
  ) => {
    const filteredValue = filterNameInput(value);
    syncInputValue(target ?? null, filteredValue);
    onNameFormChange(field, filteredValue);
    setErrorCode?.("");
  };

  const handleInputTarget = (target: NameInputTarget | null) => {
    if (!target || !isEditableProfileNameField(target.name)) {
      return;
    }

    applyNameInput(target.name, target.value ?? "", target);
  };

  const handleGcdsInput =
    (field: EditableProfileNameField) => (event: CustomEvent<string>) => {
      const target = event.target as NameInputTarget | null;
      applyNameInput(field, event.detail ?? "", target);
    };

  const onSubmitHandler: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    await onNext();
  };

  const onSubmitClick = (event: CustomEvent<string | void>) => {
    event.preventDefault();
    void onNext();
  };

  return (
    <GcdsContainer role="main">
      {errorMessage ? (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      ) : null}

      <GcdsHeading tag="h1">{pageNameEditJson["5"]}</GcdsHeading>

      <GcdsText>
        {pageNameEditJson["6"]} <strong>{pageNameEditJson["7"]}</strong>
      </GcdsText>

      <ServicesWithAccessInfoSection
        currentLang={routeLanguage}
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
            lang={routeLanguage}
            value={nameFormData.givenName}
            onInput={(event) => {
              handleInputTarget(event.target as NameInputTarget | null);
            }}
            onGcdsInput={handleGcdsInput("givenName")}
          />
          <GcdsInput
            inputId="familyName"
            label={pageNameEditJson["3"]}
            name="familyName"
            type="text"
            validateOn="other"
            data-testid="familyName"
            lang={routeLanguage}
            required
            value={nameFormData.familyName}
            onInput={(event) => {
              handleInputTarget(event.target as NameInputTarget | null);
            }}
            onGcdsInput={handleGcdsInput("familyName")}
          />
        </GcdsContainer>
      </form>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          currentLang={routeLanguage}
          disabled={false}
          onGcdsClick={onSubmitClick}
        />
        <GcdsButton
          buttonRole="secondary"
          onGcdsClick={(event: Event) => {
            event.preventDefault();
            void onCancel();
          }}
        >
          {pageNameEditJson["4"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
