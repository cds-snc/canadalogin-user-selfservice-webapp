import {
  GcdsButton,
  GcdsCheckboxes,
  GcdsContainer,
  GcdsDetails,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import {
  type ComponentPropsWithoutRef,
  type Dispatch,
  type FormEvent,
  type MouseEvent,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router";

import SubmitButton from "../../../components/Layout/SubmitButton";
import { authService } from "../../../services/authService";
import type { OtpSentData } from "../../../types/hooks";
import type { PasswordPolicyData } from "../../../types/services";
import { PAGES } from "../../../utils/constants";
import {
  getContentWithVariables,
  getPageContent,
} from "../../../utils/functions";
import { path } from "../../../utils/routeHelpers";
import { passwordUpdate } from "../api/passwordUpdate";
import { isExamplePasswordUsed } from "./passwordUtils";

type PasswordInputEvent = Parameters<
  NonNullable<ComponentPropsWithoutRef<typeof GcdsInput>["onGcdsInput"]>
>[0];
type ButtonClickEvent = Parameters<
  NonNullable<ComponentPropsWithoutRef<typeof GcdsButton>["onGcdsClick"]>
>[0];
type PasswordInputTarget = EventTarget & { value?: string };

interface PasswordProps {
  onNext: (data?: unknown) => void;
  otpSentResponse: OtpSentData | null;
  userOtpValue: string;
  setErrorCode: (errorCode: string) => void;
  errorMessage?: string | null;
  setLocalLoading: Dispatch<SetStateAction<boolean>>;
}

const defaultPasswordPolicy: PasswordPolicyData = {
  pwdMinLength: 12,
  pwdMaxLength: 110,
};

export default function Password({
  onNext,
  otpSentResponse,
  userOtpValue,
  setErrorCode,
  errorMessage,
  setLocalLoading,
}: PasswordProps) {
  const { language } = useParams();
  const resolvedLanguage = language ?? "en";
  const { cancel } = getPageContent(resolvedLanguage, "Button") ?? {};
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicyData>(
    defaultPasswordPolicy,
  );
  const [checkedValue, setCheckedValue] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const pageContentJson =
    getPageContent(resolvedLanguage, PAGES.password) ?? {};
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: resolvedLanguage,
  });

  const navigate = useNavigate();

  const onSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await completePasswordUpdate();
  };

  const onSubmitButtonClick = (event: ButtonClickEvent) => {
    event.preventDefault();
    void completePasswordUpdate();
  };

  const onSubmitButtonNativeClick = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    void completePasswordUpdate();
  };

  useEffect(() => {
    async function loadPasswordPolicy() {
      try {
        const response = await authService.requestPasswordPolicy();
        if (response?.success && response.data) {
          setPasswordPolicy(response.data);
        }
      } catch (error) {
        console.error(error);
      }
    }

    void loadPasswordPolicy();
  }, []);

  function handlePasswordChange(event: PasswordInputEvent) {
    const nextPassword = String(
      event.detail ?? (event.target as PasswordInputTarget | null)?.value ?? "",
    );
    setPasswordStrength(nextPassword.length);
    setPassword(nextPassword);
    setErrorCode("");
  }

  const completePasswordUpdate = async () => {
    if (!otpSentResponse?.trxnId) {
      return;
    }

    try {
      setErrorCode("");
      if (isExamplePasswordUsed(password)) {
        setErrorCode("example_password_used");
        return;
      }

      setLocalLoading(true);
      const response = await passwordUpdate.finalStep(
        userOtpValue,
        otpSentResponse.trxnId,
        password,
      );
      if (response?.success) {
        onNext(response.data);
      }
    } catch (error) {
      const authError = error as { data?: { message?: string } };
      if (authError.data?.message) {
        setErrorCode(authError.data.message);
      }
      console.error("err", error);
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
      <GcdsHeading tag="h1" lang={resolvedLanguage}>
        {pageContentJson["14"]}
      </GcdsHeading>

      <GcdsText>
        <span>{pageContentJson["4"]}</span>{" "}
        <strong>
          <span>
            {getContentWithVariables(pageContentJson["5"], {
              minPasswordLength: passwordPolicy.pwdMinLength,
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
            errorMessage={errorMessage ?? undefined}
            minlength={passwordPolicy.pwdMinLength}
            maxlength={passwordPolicy.pwdMaxLength}
            lang={resolvedLanguage}
            autoFocus
          ></GcdsInput>

          <GcdsCheckboxes
            legend={pageContentJson["11"]}
            name="checkbox"
            options={optionsValues}
            onGcdsChange={() => setCheckedValue(!checkedValue)}
          ></GcdsCheckboxes>

          <GcdsText>
            <span>{pageContentJson["12"]}</span>{" "}
            <strong>{passwordStrength}</strong> / {passwordPolicy.pwdMinLength}{" "}
            <span>{pageContentJson["13"]}</span>
          </GcdsText>

          <GcdsGrid columns="max-content max-content" gap="200">
            <SubmitButton
              disabled={password.length < passwordPolicy.pwdMinLength}
              style={{ width: "fit-content" }}
              currentLang={resolvedLanguage}
              onClick={onSubmitButtonNativeClick}
              onGcdsClick={onSubmitButtonClick}
            ></SubmitButton>

            <GcdsButton
              buttonRole="secondary"
              style={{ width: "fit-content" }}
              onGcdsClick={(event: ButtonClickEvent) => {
                event.preventDefault();
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
