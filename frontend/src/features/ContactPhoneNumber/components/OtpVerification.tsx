import { useEffect, useState } from "react";
import type { FormEventHandler } from "react";

import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";

import { getPageContent } from "../../../utils/functions";

import { useParams } from "react-router";
import { FLOW_TYPES, PAGES } from "../../../utils/constants";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type {
  ContactPhoneOtpType,
  ContactPhoneOtpVerificationProps,
  ContactPhonePageContent,
} from "../../../types/contactPhoneNumber";

const initialTime = 10;

interface PageHeaderProps {
  language: string;
  pageContentJson: ContactPhonePageContent;
  userMfaType: ContactPhoneOtpType;
  formattedPhoneNumber: string;
}

function PageHeader({
  language,
  pageContentJson,
  userMfaType,
  formattedPhoneNumber,
}: PageHeaderProps) {
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
          : pageContentJson["4"]}
      </GcdsText>
      <GcdsText>
        {pageContentJson["6"]} <strong>{pageContentJson["7"]}</strong>
      </GcdsText>
    </>
  );
}

export default function OtpVerification({
  onNext,
  onCancel,
  onBack,
  onChangePhoneForm,
  phoneFormData,
  errorMessage,
  requestNewOtpCode,
  setErrorCode,
}: ContactPhoneOtpVerificationProps) {
  const { language = "en" } = useParams<{ language: string }>();

  const [codeRequested, setCodeRequested] = useState(false);
  const [time, setTime] = useState(initialTime);
  const pageContentJson =
    (getPageContent(language, PAGES.verification) as
      | ContactPhonePageContent
      | undefined) ?? {};
  const buttonContent =
    (getPageContent(language, "Button") as
      | ContactPhonePageContent
      | undefined) ?? {};

  const clearValues = () => {
    onChangePhoneForm("phoneNumber", "");
    onChangePhoneForm("formattedPhoneNumber", "");
    onChangePhoneForm("otp", "");
    setCodeRequested(false);
  };

  const requestNewCode = async (otpType?: ContactPhoneOtpType) => {
    onChangePhoneForm("otp", "");
    await requestNewOtpCode(otpType ?? phoneFormData.otpType);
    setTime(initialTime);
    setCodeRequested(true);
  };

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    onChangePhoneForm("otp", target.value);
    setCodeRequested(false);
    setErrorCode?.("");
  };

  const onSubmitHandler: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    await onNext();
  };

  const onSubmitClick = (event: CustomEvent<string | void>) => {
    event.preventDefault();
    void onNext();
  };

  useEffect(() => {
    if (time <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time]);

  const userMfaType = phoneFormData.otpType;

  return (
    <GcdsContainer role="main">
      {codeRequested ? (
        <GcdsNotice
          type="success"
          noticeTitleTag="h2"
          noticeTitle={pageContentJson["17"]}
          data-testid="linkSuccess"
        >
          &nbsp;
        </GcdsNotice>
      ) : null}

      <GcdsContainer>
        <PageHeader
          language={language}
          pageContentJson={pageContentJson}
          userMfaType={userMfaType}
          formattedPhoneNumber={phoneFormData.formattedPhoneNumber}
        />

        <GcdsHeading tag="h2">{pageContentJson["8"]}</GcdsHeading>
        <form onSubmit={onSubmitHandler}>
          <GcdsInput
            inputId="verificationCode"
            label={pageContentJson["9"]}
            autoFocus
            autocomplete="one-time-code"
            name="verificationCode"
            type="text"
            value={phoneFormData.otp}
            validateOn="other"
            errorMessage={errorMessage}
            onGcdsInput={handleChange}
            lang={language}
            size={6}
            maxlength={6}
            minlength={6}
          />
        </form>

        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            disabled={phoneFormData.otp.length < 6}
            style={{ width: "fit-content" }}
            onGcdsClick={onSubmitClick}
            currentLang={language}
          />

          <GcdsButton
            buttonRole="secondary"
            style={{ width: "fit-content" }}
            onGcdsClick={(event: Event) => {
              event.preventDefault();
              void onCancel();
            }}
          >
            {buttonContent.cancel}
          </GcdsButton>
        </GcdsGrid>
      </GcdsContainer>
      <GcdsHeading tag="h2">{pageContentJson["10"]}</GcdsHeading>

      <GcdsText>
        <GcdsLink
          role="button"
          onGcdsClick={() => {
            const newOtpType =
              userMfaType === FLOW_TYPES.sms
                ? FLOW_TYPES.voice
                : FLOW_TYPES.sms;
            onChangePhoneForm("otpType", newOtpType);
            void requestNewCode(newOtpType);
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
            role="button"
            onGcdsClick={() => {
              void requestNewCode();
            }}
          >
            {pageContentJson["16"]}
          </GcdsLink>
        )}
      </GcdsText>

      <GcdsText>
        <GcdsLink
          role="button"
          onGcdsClick={() => {
            clearValues();
            void onBack();
          }}
        >
          {pageContentJson["21"]}
        </GcdsLink>
      </GcdsText>
    </GcdsContainer>
  );
}
