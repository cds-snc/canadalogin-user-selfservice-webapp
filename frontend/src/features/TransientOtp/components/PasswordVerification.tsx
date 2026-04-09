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
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["otp", "password", "common"]);

  const pageContentMap: Record<string, string> = {
    [PAGES.deleteMFAPage]: t("PasswordVerification.toDeleteNumber"),
    [PAGES.addMFAPage]: t("PasswordVerification.toAddPhone"),
    [PAGES.addFIDO2PasskeyPage]: t("PasswordVerification.toAddPasskey"),
    [PAGES.deleteFIDO2PasskeyPage]: t("PasswordVerification.toDeletePasskey"),
    [PAGES.password]: t("PasswordVerification.toChangePassword"),
  };

  const parentPageContent =
    pageContentMap[parentPage] || t("PasswordVerification.toChangePassword");

  const optionsValues = [
    {
      label: t("Password.showPassword", { ns: "password" }),
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
          {t("PasswordVerification.title")}
        </GcdsHeading>
      </GcdsContainer>
      <GcdsText>
        {parentPageContent} {t("PasswordVerification.enterCurrentPassword")}
      </GcdsText>
      <form onSubmit={onSubmitHandler}>
        <GcdsInput
          inputId="passwordVerification"
          label={t("PasswordVerification.passwordLabel")}
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
        legend={t("Password.showPassword", { ns: "password" })}
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
          {t("Button.cancel", { ns: "common" })}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
