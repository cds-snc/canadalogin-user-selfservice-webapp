import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";
import { useParams } from "react-router";
import { useState } from "react";

export default function PasswordVerification({
  errorCode: errorCodeExternal,
  userPasswordValue,
  setUserPasswordValue,
  onCancel,
  validatePassword,
  parentPage,
}) {
  const [errorCode, setErrorCode] = useState(errorCodeExternal);
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.passwordVerification);
  const errorPageJson = getPageContent(language, PAGES.error);
  const { submit, cancel } = getPageContent(language, "Button");
  const parentPageContent =
    parentPage === PAGES.deleteMFAPage
      ? pageContentJson["8"]
      : parentPage === PAGES.addMFAPage
        ? pageContentJson["7"]
        : pageContentJson["2"];

  const errorMessage =
    errorPageJson[errorCode] ||
    errorPageJson[errorCodeExternal] ||
    errorCodeExternal ||
    errorCode ||
    "";
  return (
    <GcdsContainer>
      <GcdsContainer className="gcds-gap">
        <GcdsHeading tag="h1" lang={language}>
          {pageContentJson["1"]}
        </GcdsHeading>
      </GcdsContainer>
      <GcdsText>
        {parentPageContent} {pageContentJson["3"]}
      </GcdsText>

      <GcdsInput
        inputId="passwordVerification"
        label={pageContentJson["4"]}
        autofocus
        autocomplete="one-time-code"
        name="passwordVerification"
        type="password"
        validateOn="other"
        errorMessage={errorMessage}
        value={userPasswordValue}
        onGcdsInput={(ev) => {
          setUserPasswordValue(ev.target.value);
        }}
        lang={language}
        size="12"
      ></GcdsInput>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          style={{ width: "fit-content" }}
          onGcdsClick={async (ev) => {
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
          }}
        >
          {submit}
        </GcdsButton>

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

      <GcdsHeading tag="h2">{pageContentJson["5"]}</GcdsHeading>

      <GcdsText>
        <GcdsLink>{pageContentJson["6"]}</GcdsLink>
      </GcdsText>
    </GcdsContainer>
  );
}
