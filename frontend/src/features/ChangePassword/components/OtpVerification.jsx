import { useEffect, useState, useRef } from "react";

import {
  GcdsContainer,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsNotice,
  GcdsText,
  GcdsButton,
  GcdsGrid,
  GcdsErrorMessage,
} from "@cdssnc/gcds-components-react";
import { passwordUpdate } from "../api/passwordUpdate.jsx";
import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";

import { FLOW_TYPES, PAGES } from "../../../utils/constants.jsx";
import { useParams } from "react-router";

import { useUser } from "../../../components/Providers/useUser.tsx";

const initialTime = 10;

export default function OtpVerification({
  onNext,
  userProfile,
  userSelectedMfaType,
  otpSentResponse,
  setOtpSentResponse,
  setUserOtpValue,
  userOtpValue,
  onBack,
}) {
  const { language } = useParams();
  const { state } = useUser();

  const [codeRequested, setCodeRequested] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  const navigateHelper = useNavigateHelper();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });
  // const { setError, clearAllErrors, getError, hasErrors } = useError(language);
  const [time, setTime] = useState(initialTime);
  const pageContentJson = getPageContent(language, PAGES.verification);
  const errorPageJson = getPageContent(language, PAGES.error);
  const { submit, cancel } = getPageContent(language, "Button");

  // const error = getError('#verificationCode');
  const { id, userName } = userProfile ?? {};
  const didFetch = useRef(false);
  const fetchInProgress = (bool) => {
    // in dev the component makes two requests
    // this might not be needed when its built in a production environment
    didFetch.current = bool;
  };

  const requestOtpCode = async () => {
    try {
      const response = await passwordUpdate.firstStep(
        userName,
        userSelectedMfaType.type,
      );
      if (response && response.success) {
        setOtpSentResponse(response.data);
      }
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
      setCodeRequested(false);
    } finally {
      fetchInProgress(false);
    }
  };

  const validateOtpCode = async (userOtpValue) => {
    try {
      const response = await passwordUpdate.secondStep(
        userOtpValue,
        otpSentResponse.trxId,
      );
      if (response && response.success) {
        onNext(response.data);
      }
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setUserOtpValue(value);
  };

  useEffect(() => {
    if (time <= 0) return;

    const timer = setTimeout(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time]);

  useEffect(() => {
    if (!id || didFetch.current) return;
    fetchInProgress(true);
    requestOtpCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const userMfaType = userSelectedMfaType.type;
  const errorMessage = errorPageJson[errorCode] || "";
  return (
    <GcdsContainer>
      {/* <GcdsErrorSummary
                data-testid='errorSummary'
                errorLinks={"Anohter "}
                heading="Error Message"
            /> */}
      {errorMessage != "" && (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      )}

      {codeRequested && (
        <GcdsNotice
          type="success"
          noticeTitleTag="h2"
          noticeTitle={pageContentJson["17"]}
          data-testid="linkSuccess"
        >
          &nbsp;
        </GcdsNotice>
      )}

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
          <strong>{userSelectedMfaType.phoneNumber}</strong>
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

        {state.testData !== undefined && (
          <GcdsInput
            inputId="verificationCode"
            label={pageContentJson["9"]}
            name="verificationCode"
            value={state.testData.otp}
            type="text"
            autofocus
            validateOn="other"
            // errorMessage={error.errorMsg}
            lang={language}
            size="6"
            maxlength={6}
            required
          ></GcdsInput>
        )}
        {state.testData === undefined && (
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
            required={errorMessage == ""}
          ></GcdsInput>
        )}

        <GcdsGrid
          columns="repeat(auto-fit, minmax(100px, 100px))"
          gap="10px"
          align-items="center"
        >
          <GcdsButton
            disabled={userOtpValue.length < 6}
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              validateOtpCode(userOtpValue);
              setErrorCode("");
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
      <GcdsHeading tag="h2">{pageContentJson["10"]}</GcdsHeading>

      <GcdsText>
        {time <= 0 ? (
          <GcdsLink
            onGcdsClick={() => {
              onBack();
            }}
          >
            {pageContentJson["21"]}
          </GcdsLink>
        ) : (
          ""
        )}
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
            onGcdsClick={() => {
              requestOtpCode();
              setCodeRequested(true);
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
    </GcdsContainer>
  );
}
