import { useEffect, useState } from "react";

import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";
import { FLOW_TYPES, PAGES } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";
import SubmitButton from "../../../../components/Layout/SubmitButton";

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

export default function AddMFAOtpVerification({
  onNext,
  onCancel,
  onBack,
  onChangePhoneForm,
  phoneFormData,
  errorMessage,
  requestNewOtpCode,
  onUseDifferentPhoneNumber,
  onSetupAlternateMFAMethod,
}) {
  const { language } = useParams();

  const [codeRequested, setCodeRequested] = useState(false);
  const [time, setTime] = useState(initialTime);
  const pageContentJson = getPageContent(language, PAGES.verification);
  const { cancel } = getPageContent(language, "Button");

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

  // Clear OTP field on mount
  useEffect(() => {
    onChangePhoneForm("otp", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (time <= 0) return;

    const timer = setTimeout(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time]);

  const userMfaType = phoneFormData.otpType;

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    await onNext();
  };

  return (
    <GcdsContainer role="main">
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
        <form onSubmit={onSubmitHandler}>
          {" "}
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
        </form>

        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            disabled={phoneFormData.otp.length < 6}
            style={{ width: "fit-content" }}
            onGcdsClick={onSubmitHandler}
            currentLang={language}
          ></SubmitButton>

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
        <GcdsLink
          onGcdsClick={async () => {
            await onSetupAlternateMFAMethod();
          }}
        >
          {userMfaType === FLOW_TYPES.sms
            ? pageContentJson["29"]
            : pageContentJson["28"]}
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
          onGcdsClick={async () => {
            clearValues();
            await onUseDifferentPhoneNumber();
            onBack();
          }}
        >
          {pageContentJson["21"]}
        </GcdsLink>
      </GcdsText>
    </GcdsContainer>
  );
}
