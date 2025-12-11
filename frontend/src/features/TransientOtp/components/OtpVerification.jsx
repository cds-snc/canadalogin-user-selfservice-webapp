import { useEffect, useRef, useState } from "react";

import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";
import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";

import { useParams } from "react-router";
import { FLOW_TYPES, PAGES } from "../../../utils/constants.jsx";
import { gcHelpCentreLinks } from "../../../utils/gcHelpCentreLinks.jsx";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";
import { useEnterKeySubmit } from "../../../utils/enterKeyHandler.jsx";

const initialTime = 10;

export default function OtpVerification({
  userProfile,
  userSelectedMfaFactor,
  setUserOtpValue,
  userOtpValue,
  onBack,
  requestOtpCode,
  validateOtpCode,
  setErrorCode,
  errorMessage,
}) {
  const { language } = useParams();

  const navigateHelper = useNavigateHelper();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });
  const [time, setTime] = useState(initialTime);
  const pageContentJson = getPageContent(language, PAGES.verification);
  const { cancel } = getPageContent(language, "Button");

  const { id } = userProfile ?? {};
  const didFetch = useRef(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setUserOtpValue(value);
  };

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    setErrorCode(""); // Clear any previous errors
    try {
      await validateOtpCode(userOtpValue);
    } catch (error) {
      // Handle validation errors
      if (error?.data?.message) {
        setErrorCode(error.data.message);
      }
    }
  };

  const handleKeyDown = useEnterKeySubmit(onSubmitHandler);

  useEffect(() => {
    if (time <= 0) return;

    const timer = setTimeout(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time]);

  useEffect(() => {
    if (!id || didFetch.current) return;
    didFetch.current = true;

    const sendOtpRequest = async () => {
      try {
        await requestOtpCode();
      } catch (error) {
        // Handle OTP request errors
        if (error?.data?.message) {
          setErrorCode(error.data.message);
        }
      }
    };

    sendOtpRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const userMfaType = userSelectedMfaFactor?.type;
  return (
    <GcdsContainer role="main" onKeyDown={handleKeyDown}>
      <GcdsContainer>
        <GcdsHeading tag="h1" lang={language}>
          {userMfaType === FLOW_TYPES.email
            ? pageContentJson["22"]
            : pageContentJson["1"]}
        </GcdsHeading>

        <GcdsText>
          {userMfaType === FLOW_TYPES.voice
            ? pageContentJson["3"]
            : userMfaType === FLOW_TYPES.sms
              ? pageContentJson["2"]
              : pageContentJson["23"]}
          &nbsp;
          <strong>{userSelectedMfaFactor.phoneNumber}</strong>
        </GcdsText>
        <GcdsText>
          {userMfaType === FLOW_TYPES.voice
            ? pageContentJson["5"]
            : userMfaType === FLOW_TYPES.sms
              ? pageContentJson["4"]
              : pageContentJson["24"]}
        </GcdsText>
        <GcdsText>
          {pageContentJson["6"]} <strong>{pageContentJson["7"]}</strong>
        </GcdsText>
        {userMfaType !== FLOW_TYPES.email && (
          <GcdsHeading tag="h2">{pageContentJson["8"]}</GcdsHeading>
        )}

        <GcdsInput
          inputId="verificationCode"
          label={pageContentJson["9"]}
          autofocus
          autocomplete="one-time-code"
          name="verificationCode"
          type="text"
          validateOn="other"
          errorMessage={errorMessage}
          value={userOtpValue}
          onGcdsInput={handleChange}
          lang={language}
          size="6"
          maxlength={6}
          minlength={6}
          required={errorMessage === ""}
        ></GcdsInput>

        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            disabled={userOtpValue.length < 6}
            style={{ width: "fit-content" }}
            onGcdsClick={onSubmitHandler}
            currentLang={language}
          ></SubmitButton>

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
      <GcdsHeading tag="h2">{pageContentJson["10"]}</GcdsHeading>

      <GcdsText>
        <GcdsLink
          role="button"
          onGcdsClick={() => {
            onBack();
          }}
        >
          {pageContentJson["21"]}
        </GcdsLink>
      </GcdsText>

      <GcdsText>
        {time > 0 ? (
          <span>
            {pageContentJson["14"]}
            <strong>
              {" "}
              {time} {pageContentJson["15"]}
            </strong>
          </span>
        ) : (
          <GcdsLink
            role="button"
            onGcdsClick={() => {
              requestOtpCode();
              setTime(initialTime);
              setErrorCode("");
              setUserOtpValue("");
            }}
          >
            {userMfaType !== FLOW_TYPES.email
              ? pageContentJson["16"]
              : pageContentJson["26"]}
          </GcdsLink>
        )}
      </GcdsText>
      <GcdsText>
        <GcdsLink href={gcHelpCentreLinks.cannotAccessPhone} target="_blank">
          {pageContentJson["30"]}
        </GcdsLink>
      </GcdsText>
    </GcdsContainer>
  );
}
