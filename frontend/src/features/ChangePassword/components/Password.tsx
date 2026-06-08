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
  GcdsNotice,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["password", "common"]);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    min: 12,
    max: 110,
  });
  const [checkedValue, setCheckedValue] = useState(false);
  const [password, setPassword] = useState("");

  const [passwordStrength, setPasswordStrength] = useState(0);
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
      label: t("Password.showPassword"),
      id: "checkbox1",
      value: "checkbox1",
      checked: checkedValue,
    },
  ];

  return (
    <GcdsContainer role="main">
      <GcdsNotice
        noticeRole="success"
        noticeTitleTag="h2"
        noticeTitle={t("Password.otpVerifiedNoticeTitle")}
      >
        <GcdsText>{t("Password.otpVerifiedNoticeBody")}</GcdsText>
      </GcdsNotice>

      <GcdsHeading tag="h1" lang={language}>
        {t("Password.enterNewPassword")}
      </GcdsHeading>

      <GcdsText>
        <span>{t("Password.requirementsIntro")}</span>{" "}
        <strong>
          <span>
            {t("Password.minCharacters", {
              minPasswordLength: passwordPolicy.min,
            })}
          </span>
        </strong>
        {". "}
        <span>{t("Password.multipleWords")}</span>
      </GcdsText>
      <GcdsDetails
        detailsTitle={t("Password.safetyTipsTitle")}
        style={{ marginBottom: "1rem" }}
      >
        <GcdsText>{t("Password.safetyTipsContent")}</GcdsText>
      </GcdsDetails>

      <form onSubmit={onSubmitHandler}>
        <GcdsContainer>
          <GcdsInput
            inputId="input-password"
            label={t("Password.label")}
            name="password"
            hint={t("Password.placeholder")}
            type={checkedValue ? "text" : "password"}
            onGcdsInput={handlePasswordChange}
            errorMessage={errorMessage}
            minlength={passwordPolicy.min}
            maxlength={passwordPolicy.max}
            lang={language}
            autoFocus
            size={18}
          ></GcdsInput>

          <GcdsCheckboxes
            id="checkbox-default"
            legend={t("Password.showPassword")}
            name="checkbox"
            options={optionsValues}
            onGcdsChange={() => setCheckedValue(!checkedValue)}
          ></GcdsCheckboxes>

          <GcdsText>
            <span>{t("Password.minimumLength")}</span>{" "}
            <strong>{passwordStrength}</strong> / {passwordPolicy.min}{" "}
            <span>{t("Password.characters")}</span>
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
              {t("Button.cancel", { ns: "common" })}
            </GcdsButton>
          </GcdsGrid>
        </GcdsContainer>
      </form>
    </GcdsContainer>
  );
}
