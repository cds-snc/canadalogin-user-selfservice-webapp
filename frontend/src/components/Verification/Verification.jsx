import {
  GcdsContainer,
  GcdsErrorSummary,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsNotice,
  GcdsStepper,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { getPageContent, isCodeValid } from "../../utils/functions.jsx";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  LINK_SUBMIT_TYPES,
  PAGES,
  SERVICES,
  SUBMIT_END_POINTS,
} from "../../utils/constants.jsx";
import { useParams } from "react-router";
import SubmitButton from "../Layout/SubmitButton.jsx";
import { useUser } from "../Providers/useUser.tsx";
import { useEffect, useState } from "react";
import { useLinkSubmit } from "../../hooks/useLinkSubmit.js";
import { useSubmit } from "../../hooks/useSubmit";
import { useError } from "../../hooks/useError";
const initialTime = 10;

export default function Verification() {
  const {
    type = FLOW_TYPES.email,
    flow = FLOW_TYPES.manage,
    language,
  } = useParams();
  const { state } = useUser();
  const { setError, clearAllErrors, getError, hasErrors } = useError(language);
  const [time, setTime] = useState(initialTime);
  const pageContentJson = getPageContent(language, PAGES.verification);
  const error = getError("#verificationCode");

  const submitDataOptions = {
    language,
    endpoint: SUBMIT_END_POINTS.otpVerify,
    navigateTo: "/" + language + "/redirecttorp",
    page: PAGES.verification,
    flow: flow,
    type: type,
    onError: (err) => setError("#verificationCode", err),
  };

  const linkSubmitDataOptions = {
    language,
    endpoint: SUBMIT_END_POINTS.otpSend,
    navigateTo: null,
    page: PAGES.verification,
    flow: flow,
    type: type,
    onError: (err) => setError("#verificationCode", err),
  };

  const { handleSubmit, isPending } = useSubmit(
    submitDataOptions,
    validateCode,
  );
  const { handleLinkSubmit, isLinkPending, codeRequested, timesRequested } =
    useLinkSubmit(linkSubmitDataOptions);

  useEffect(() => {
    if (time <= 0) return;

    const timer = setTimeout(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time]);

  function validateCode(code) {
    clearAllErrors();
    if (!isCodeValid(code)) {
      setError("#verificationCode", "3");
      return false;
    }
    return true;
  }

  return (
    <GcdsContainer>
      {hasErrors() && (
        <GcdsErrorSummary
          data-testid="errorSummary"
          errorLinks={`{"#verificationCode": "${error.errorMsg}"}`}
          heading={error.heading}
        />
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
        <GcdsText>
          {type === FLOW_TYPES.voice
            ? pageContentJson["3"]
            : type === FLOW_TYPES.sms
              ? pageContentJson["2"]
              : pageContentJson["23"]}
          &nbsp;
          <strong>
            {type !== FLOW_TYPES.email
              ? state.userData.phone
              : state.userData.email}
          </strong>
        </GcdsText>
        <GcdsText>
          {type === FLOW_TYPES.voice
            ? pageContentJson["5"]
            : type === FLOW_TYPES.sms
              ? pageContentJson["4"]
              : pageContentJson["24"]}
        </GcdsText>
        <GcdsText>
          {pageContentJson["6"]} <strong>{pageContentJson["7"]}</strong>
        </GcdsText>
        {type !== FLOW_TYPES.email && (
          <GcdsHeading tag="h2">{pageContentJson["8"]}</GcdsHeading>
        )}
        <form id="form" onSubmit={handleSubmit}>
          {state.testData !== undefined && (
            <GcdsInput
              inputId="verificationCode"
              label={pageContentJson["9"]}
              name="verificationCode"
              value={state.testData.otp}
              type="text"
              validateOn="other"
              errorMessage={error.errorMsg}
              lang={language}
              size="6"
              required
            ></GcdsInput>
          )}
          {state.testData === undefined && (
            <GcdsInput
              inputId="verificationCode"
              label={pageContentJson["9"]}
              name="verificationCode"
              type="text"
              validateOn="other"
              errorMessage={error.errorMsg}
              lang={language}
              size="6"
              required
            ></GcdsInput>
          )}
          <SubmitButton
            currentLang={language}
            disabled={isPending && isLinkPending}
          />
        </form>
      </GcdsContainer>
      <GcdsHeading tag="h2">{pageContentJson["10"]}</GcdsHeading>
      {type !== FLOW_TYPES.email && (
        <GcdsText>
          {time <= 0 && !isPending ? (
            <GcdsLink
              href="#"
              onClick={() => {
                clearAllErrors();
                handleLinkSubmit(LINK_SUBMIT_TYPES.requestNewCode, true).then(
                  () => setTime(initialTime * timesRequested),
                );
                document.getElementById("form").reset();
              }}
            >
              {type === FLOW_TYPES.voice
                ? pageContentJson["12"]
                : pageContentJson["11"]}
            </GcdsLink>
          ) : (
            ""
          )}
        </GcdsText>
      )}
      <GcdsText>
        {time > 0 && !isPending ? (
          <span>
            {pageContentJson["14"]}
            <strong>
              {" "}
              {time} {pageContentJson["15"]}
            </strong>
          </span>
        ) : !isPending ? (
          <GcdsLink
            href="#"
            onClick={() => {
              clearAllErrors();
              handleLinkSubmit(LINK_SUBMIT_TYPES.requestNewCode, false).then(
                () => setTime(initialTime * timesRequested),
              );
              document.getElementById("form").reset();
            }}
          >
            {type !== FLOW_TYPES.email
              ? pageContentJson["16"]
              : pageContentJson["26"]}
          </GcdsLink>
        ) : (
          ""
        )}
      </GcdsText>
    </GcdsContainer>
  );
}
