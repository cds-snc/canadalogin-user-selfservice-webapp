import { useEffect, useState } from "react";

import {
  GcdsContainer,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsNotice,
  GcdsText,
  GcdsButton,
  GcdsGrid,
} from "@cdssnc/gcds-components-react";

import { getPageContent } from "../../../utils/functions.jsx";

import { FLOW_TYPES, PAGES } from "../../../utils/constants.jsx";
import { useParams } from "react-router";
import ErrorSummaryWithFocus from "../../../components/ErrorSummaryWithFocus/ErrorSummaryWithFocus.jsx";

const initialTime = 10;

const PageHeader = ({
  language,
  pageContentJson,
  userMfaType,
  formattedPhoneNumber,
}) => {
  return (
    <>
      <GcdsHeading tag="h1" lang={language}>
        {pageContentJson["1"]}
      </GcdsHeading>
      <GcdsText marginBottom="0">
        {userMfaType === FLOW_TYPES.sms
          ? pageContentJson["2"]
          : pageContentJson["3"]}
      </GcdsText>
      <GcdsText marginTop="0">
        <strong>{formattedPhoneNumber}</strong>
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
    </>
  );
};

export default function OtpVerification({
  onNext,
  onCancel,
  onBack,
  onChangePhoneForm,
  phoneFormData,
  errorMessage,
  requestNewOtpCode,
}) {
  const { language } = useParams();

  const [codeRequested, setCodeRequested] = useState(false);
  const [time, setTime] = useState(initialTime);
  const pageContentJson = getPageContent(language, PAGES.verification);
  const { submit, cancel } = getPageContent(language, "Button");

  const clearValues = () => {
    onChangePhoneForm("phoneNumber", "");
    onChangePhoneForm("formattedPhoneNumber", "");
    onChangePhoneForm("otp", "");
    setCodeRequested(false);
  };

  const requestNewCode = () => {
    onChangePhoneForm("otp", "");
    requestNewOtpCode();
    setTime(initialTime);
    setCodeRequested(true);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    onChangePhoneForm("otp", value);
    setCodeRequested(false);
  };

  useEffect(() => {
    if (time <= 0) return;

    const timer = setTimeout(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time]);

  const userMfaType = phoneFormData.otpType;

  return (
    <GcdsContainer>
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
        <PageHeader
          language={language}
          pageContentJson={pageContentJson}
          userMfaType={userMfaType}
          formattedPhoneNumber={phoneFormData.formattedPhoneNumber}
        />

        <GcdsHeading tag="h2">{pageContentJson["8"]}</GcdsHeading>

        <GcdsInput
          inputId="verificationCode"
          label={pageContentJson["9"]}
          autofocus
          autocomplete="one-time-code"
          name="verificationCode"
          type="text"
          value={phoneFormData.otp}
          validateOn="other"
          errorMessage={errorMessage}
          onGcdsInput={handleChange}
          lang={language}
          size="6"
          maxlength={6}
          minlength={6}
        ></GcdsInput>

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            disabled={phoneFormData.otp.length < 6}
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              onNext();
            }}
          >
            {submit}
          </GcdsButton>

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
      <GcdsHeading tag="h2">{pageContentJson["10"]}</GcdsHeading>

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
              requestNewCode();
            }}
          >
            {userMfaType !== FLOW_TYPES.email
              ? pageContentJson["16"]
              : pageContentJson["26"]}
          </GcdsLink>
        )}
      </GcdsText>

      <GcdsText>
        <GcdsLink
          onGcdsClick={() => {
            clearValues();
            onBack();
          }}
        >
          {pageContentJson["21"]}
        </GcdsLink>
      </GcdsText>
    </GcdsContainer>
  );
}
