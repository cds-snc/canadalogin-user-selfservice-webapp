import { useEffect, useState } from "react";
import type { FormEventHandler } from "react";
import { useParams, useNavigate } from "react-router";
import {
  GcdsContainer,
  GcdsText,
  GcdsDetails,
  GcdsInput,
  GcdsCheckboxes,
  GcdsGrid,
  GcdsButton,
  GcdsHeading,
} from "@cdssnc/gcds-components-react";
import {
  getContentWithVariables,
  getPageContent,
} from "../../../utils/functions";
import { authService } from "../../../services/authService";
import { passwordUpdate } from "../api/passwordUpdate";

import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type {
  AuthServiceError,
  PasswordPolicyData,
} from "../../../types/services";
import type { PasswordUpdateTransactionData } from "../api/passwordUpdate";

interface PasswordPolicy {
  min: number;
  max: number;
}

interface PasswordProps {
  onNext: (data?: unknown) => void;
  otpSentResponse: PasswordUpdateTransactionData;
  userOtpValue: string;
  setErrorCode: (errorCode: string) => void;
  errorMessage?: string;
  setLocalLoading: (isLoading: boolean) => void;
}

function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const authError = error as AuthServiceError;
  return authError.data?.message ?? authError.response?.data?.message;
}

export default function Password({
  onNext,
  otpSentResponse,
  userOtpValue,
  setErrorCode,
  errorMessage,
  setLocalLoading,
}: PasswordProps) {
  const { language } = useParams<{ language: string }>();
  const { cancel } = getPageContent(language, "Button") ?? {};
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    min: 12,
    max: 110,
  });
  const [checkedValue, setCheckedValue] = useState(false);
  const [password, setPassword] = useState("");

  const [passwordStrength, setPasswordStrength] = useState(0);
  const pageContentJson = getPageContent(language, PAGES.password) ?? {};
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language,
  });

  const navigate = useNavigate();

  const onSubmitHandler: FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    void completePasswordUpdate();
  };

  useEffect(() => {
    async function loadMinMax() {
      try {
        const response = await authService.requestPasswordPolicy();
        const policyData = response?.data as PasswordPolicyData | undefined;
        if (response?.success && policyData) {
          const policy = {
            min: policyData.pwdMinLength,
            max: policyData.pwdMaxLength,
          };
          setPasswordPolicy(policy);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadMinMax();
  }, []);

  function handlePasswordChange(event: CustomEvent<string>) {
    const input = event.target as HTMLInputElement;
    setPasswordStrength(input.value.length);
    setPassword(input.value);
    setErrorCode("");
  }

  function isExamplePasswordUsed(pwd: string) {
    // remove all whitespace and lowercase
    // disallow "pillowmoosedish" in any casing/spacing

    const normalized = pwd.replace(/\s+/g, "").toLowerCase();
    return normalized === "pillowmoosedish";
  }

  const completePasswordUpdate = async () => {
    try {
      setErrorCode("");
      if (isExamplePasswordUsed(password)) {
        setErrorCode("example_password_used");
        return;
      }
      setLocalLoading(true);
      const response = await passwordUpdate.finalStep(
        userOtpValue,
        otpSentResponse.trxId,
        password,
      );
      if (response && response.success) {
        onNext(response.data);
      }
    } catch (err) {
      const errorMessage = getApiErrorMessage(err);
      if (errorMessage) {
        setErrorCode(errorMessage);
      }
      console.error("err", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const optionsValues = [
    {
      label: pageContentJson["11"],
      id: "checkbox1",
      value: "checkbox1",
      checked: checkedValue,
    },
  ];

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1" lang={language}>
        {pageContentJson["14"]}
      </GcdsHeading>

      <GcdsText>
        <span>{pageContentJson["4"]}</span>{" "}
        <strong>
          <span>
            {getContentWithVariables(pageContentJson["5"], {
              minPasswordLength: passwordPolicy.min,
            })}
          </span>
        </strong>
        {". "}
        <span>{pageContentJson["6"]}</span>
      </GcdsText>
      <GcdsDetails
        detailsTitle={pageContentJson["7"]}
        style={{ marginBottom: "1rem" }}
      >
        <GcdsText>{pageContentJson["8"]}</GcdsText>
      </GcdsDetails>

      <form onSubmit={onSubmitHandler}>
        <GcdsContainer>
          <GcdsInput
            inputId="input-password"
            label={pageContentJson["9"]}
            name="password"
            hint={pageContentJson["10"]}
            type={checkedValue ? "text" : "password"}
            onGcdsInput={handlePasswordChange}
            errorMessage={errorMessage}
            minlength={passwordPolicy.min}
            maxlength={passwordPolicy.max}
            lang={language}
            autoFocus
          ></GcdsInput>

          <GcdsCheckboxes
            id="checkbox-default"
            legend={pageContentJson["11"]}
            name="checkbox"
            options={optionsValues}
            onGcdsChange={() => setCheckedValue(!checkedValue)}
          ></GcdsCheckboxes>

          <GcdsText>
            <span>{pageContentJson["12"]}</span>{" "}
            <strong>{passwordStrength}</strong> / {passwordPolicy.min}{" "}
            <span>{pageContentJson["13"]}</span>
          </GcdsText>

          <GcdsGrid columns="max-content max-content" gap="200">
            <SubmitButton
              disabled={password.length < passwordPolicy.min}
              style={{ width: "fit-content" }}
              currentLang={language ?? "en"}
            ></SubmitButton>

            <GcdsButton
              buttonRole="secondary"
              style={{ width: "fit-content" }}
              onGcdsClick={(ev) => {
                ev.preventDefault();
                navigate(backToSecuritySettingsPage);
              }}
            >
              {cancel}
            </GcdsButton>
          </GcdsGrid>
        </GcdsContainer>
      </form>
    </GcdsContainer>
  );
}
