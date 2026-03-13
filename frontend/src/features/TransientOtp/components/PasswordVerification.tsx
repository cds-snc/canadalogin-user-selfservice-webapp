import { useState } from "react";
import type { FormEventHandler } from "react";

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

type CaughtApiError = { data?: { message?: string } };

interface PasswordVerificationProps {
  userPasswordValue: string;
  setUserPasswordValue: (value: string) => void;
  onCancel: () => void;
  validatePassword: (password: string) => Promise<void>;
  parentPage: string;
  setErrorCode: (errorCode: string) => void;
  errorMessage?: string;
}

export default function PasswordVerification({
  userPasswordValue,
  setUserPasswordValue,
  onCancel,
  validatePassword,
  parentPage,
  setErrorCode,
  errorMessage,
}: PasswordVerificationProps) {
  const { language } = useParams();
  const [checkedValue, setCheckedValue] = useState(false);

  const pageContentJson =
    getPageContent(language, PAGES.passwordVerification) ?? {};
  const passwordPageContentJson =
    getPageContent(language, PAGES.password) ?? {};

  const { cancel } = getPageContent(language, "Button") ?? {};

  const pageContentMap: Record<string, string> = {
    [PAGES.deleteMFAPage]: pageContentJson["8"],
    [PAGES.addMFAPage]: pageContentJson["7"],
    [PAGES.addFIDO2PasskeyPage]: pageContentJson["9"],
    [PAGES.deleteFIDO2PasskeyPage]: pageContentJson["10"],
    [PAGES.password]: pageContentJson["2"],
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

  const doSubmit = async () => {
    setErrorCode(""); // Clear any previous errors
    try {
      await validatePassword(userPasswordValue);
    } catch (error) {
      // Handle validation errors
      const apiError = error as CaughtApiError;
      if (apiError?.data?.message) {
        setErrorCode(apiError.data.message);
      }
    }
  };

  const onSubmitHandler: FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    void doSubmit();
  };

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
          autoFocus
          autocomplete="one-time-code"
          name="passwordVerification"
          type={checkedValue ? "text" : "password"}
          validateOn="other"
          errorMessage={errorMessage}
          value={userPasswordValue}
          onGcdsInput={(ev: CustomEvent<string>) => {
            setUserPasswordValue((ev.target as HTMLInputElement).value);
          }}
          lang={language}
          size={12}
        ></GcdsInput>
      </form>
      <GcdsCheckboxes
        id="password-checkbox"
        legend={passwordPageContentJson["11"]}
        name="show-password-checkbox"
        options={optionsValues}
        onGcdsChange={() => setCheckedValue(!checkedValue)}
      ></GcdsCheckboxes>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          currentLang={language ?? "en"}
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            void doSubmit();
          }}
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
