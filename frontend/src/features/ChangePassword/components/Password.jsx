import { useEffect, useState } from "react";
import {
  GcdsContainer,
  GcdsText,
  GcdsDetails,
  GcdsInput,
  GcdsStepper,
  GcdsLink,
  GcdsCheckboxes,
  GcdsGrid,
  GcdsButton,
  GcdsHeading,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions.jsx";
import { authService } from "../../../services/authService.jsx";
import { passwordUpdate } from "../api/passwordUpdate.jsx";

import { PAGES } from "../../../utils/constants.jsx";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { useParams } from "react-router";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";
import { path } from "../../../utils/routeHelpers.js";

export default function Password({
  onNext,
  otpSentResponse,
  userOtpValue,
  setErrorCode,
  errorMessage,
}) {
  const { state } = useUser();
  const { language } = useParams();
  const { submit, cancel } = getPageContent(language, "Button");
  const [passwordPolicy, setPasswordPolicy] = useState({ min: 12, max: 110 });
  const [checkedValue, setCheckedValue] = useState(false);
  const [password, setPassword] = useState("");

  const [passwordStrength, setPasswordStrength] = useState(0);
  const pageContentJson = getPageContent(language, PAGES.password);
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });
  const navigateHelper = useNavigateHelper();

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

  const completePasswordUpdate = async () => {
    try {
      setErrorCode("");
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
    <GcdsContainer>
      <GcdsHeading tag="h1" lang={language}>
        {pageContentJson["14"]}
      </GcdsHeading>

      <>
        <GcdsText>
          <span>{pageContentJson["4"]}</span>{" "}
          <strong>
            <span>{pageContentJson["5"]}</span> {passwordPolicy.min}{" "}
          </strong>{" "}
          <span>{pageContentJson["6"]}</span>
        </GcdsText>
        <GcdsDetails detailsTitle={pageContentJson["7"]}>
          <GcdsText>{pageContentJson["8"]}</GcdsText>
        </GcdsDetails>
      </>

      <GcdsContainer>
        {state.testData !== undefined && (
          <GcdsInput
            inputId="input-password"
            label={pageContentJson["9"]}
            name="password"
            value={state.testData.password}
            hint={pageContentJson["10"]}
            type="password"
            onGcdsInput={handlePasswordChange}
            // errorMessage={error.errorMsg}
          ></GcdsInput>
        )}
        {state.testData === undefined && (
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
        )}
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
          <GcdsButton
            disabled={password.length < passwordPolicy.min}
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              completePasswordUpdate();
            }}
          >
            {submit}
          </GcdsButton>

          <GcdsButton
            buttonRole="secondary"
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              navigateHelper(backToSecuritySettingsPage);
            }}
          >
            {cancel}
          </GcdsButton>
        </GcdsGrid>
      </GcdsContainer>
    </GcdsContainer>
  );
}
