import { useState } from "react";

import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsText,
  GcdsCheckboxes,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";
import { useParams } from "react-router";
import SubmitButton from "../../../components/Layout/SubmitButton";

export default function PasswordVerification({
  userPasswordValue,
  setUserPasswordValue,
  onCancel,
  validatePassword,
  parentPage,
  setErrorCode,
  errorMessage,
}) {
  const { language } = useParams();
  const [checkedValue, setCheckedValue] = useState(false);

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    setErrorCode(""); // Clear any previous errors
    try {
      await validatePassword(userPasswordValue);
    } catch (error) {
      // Handle validation errors
      if (error?.data?.message) {
        setErrorCode(error.data.message);
      }
    }
  };

  const pageContentJson = getPageContent(language, PAGES.passwordVerification);
  const passwordPageContentJson = getPageContent(language, PAGES.password);

  const { cancel } = getPageContent(language, "Button");

  const pageContentMap = {
    [PAGES.deleteMFAPage]: pageContentJson["8"],
    [PAGES.addMFAPage]: pageContentJson["7"],
    [PAGES.addFIDO2Passkey]: pageContentJson["9"],
    [PAGES.deleteFIDO2Passkey]: pageContentJson["10"],
  };

  const parentPageContent = pageContentMap[parentPage] || pageContentJson["2"];

  const optionsValues = [
    {
      label: passwordPageContentJson["11"],
      id: "show-password-checkbox",
      value: "show-password-checkbox",
      checked: checkedValue,
    },
  ];

  return (
    <GcdsContainer role="main">
      <GcdsContainer className="gcds-gap">
        <GcdsHeading tag="h1" lang={language}>
          {pageContentJson["1"]}
        </GcdsHeading>
      </GcdsContainer>
      <GcdsText>
        {parentPageContent} {pageContentJson["3"]}
      </GcdsText>
      <form onSubmit={onSubmitHandler}>
        <GcdsInput
          inputId="passwordVerification"
          label={pageContentJson["4"]}
          autofocus
          autocomplete="one-time-code"
          name="passwordVerification"
          type={checkedValue ? "text" : "password"}
          validateOn="other"
          errorMessage={errorMessage}
          value={userPasswordValue}
          onGcdsInput={(ev) => {
            setUserPasswordValue(ev.target.value);
          }}
          lang={language}
          size="12"
        ></GcdsInput>
      </form>
      <GcdsCheckboxes
        checkboxId="password-checkbox"
        legend={passwordPageContentJson["11"]}
        name="show-password-checkbox"
        options={optionsValues}
        onGcdsChange={() => setCheckedValue(!checkedValue)}
      ></GcdsCheckboxes>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          currentLang={language}
          style={{ width: "fit-content" }}
          onGcdsClick={onSubmitHandler}
        ></SubmitButton>

        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
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
