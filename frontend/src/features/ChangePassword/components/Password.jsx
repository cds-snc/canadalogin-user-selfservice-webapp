import { useEffect, useState } from "react";
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
} from "../../../utils/functions.jsx";
import { authService } from "../../../services/authService.jsx";
import { passwordUpdate } from "../api/passwordUpdate.jsx";

import { PAGES } from "../../../utils/constants.jsx";
import { path } from "../../../utils/routeHelpers.js";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";

export default function Password({
  onNext,
  otpSentResponse,
  userOtpValue,
  setErrorCode,
  errorMessage,
}) {
  const { language } = useParams();
  const { cancel } = getPageContent(language, "Button");
  const [passwordPolicy, setPasswordPolicy] = useState({ min: 12, max: 110 });
  const [checkedValue, setCheckedValue] = useState(false);
  const [password, setPassword] = useState("");

  const [passwordStrength, setPasswordStrength] = useState(0);
  const pageContentJson = getPageContent(language, PAGES.password);
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });

  const navigate = useNavigate();

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    await completePasswordUpdate();
  };

  useEffect(() => {
    async function loadMinMax() {
      try {
        const response = await authService.requestPasswordPolicy();
        if (response.success) {
          const policy = {
            min: response.data.pwdMinLength,
            max: response.data.pwdMaxLength,
          };
          setPasswordPolicy(policy);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadMinMax();
  }, []);

  function handlePasswordChange(event) {
    setPasswordStrength(event.target.value.length);
    setPassword(event.target.value);
    setErrorCode("");
  }

  function isExamplePasswordUsed(pwd) {
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

      const response = await passwordUpdate.finalStep(
        userOtpValue,
        otpSentResponse.trxId,
        password,
      );
      if (response && response.success) {
        onNext(response.data);
      }
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
      console.error("err", err);
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
            autofocus
          ></GcdsInput>

          <GcdsCheckboxes
            checkboxId="checkbox-default"
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
              currentLang={language}
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
