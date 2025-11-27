import { useState } from "react";
import { useParams } from "react-router";
import { isValidPhoneNumber } from "libphonenumber-js";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";

import {
  GcdsContainer,
  GcdsDetails,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
  GcdsRadios,
  GcdsButton,
  GcdsErrorMessage,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions.jsx";
import {
  countryMapping,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants.jsx";

const ServicesAccessingPhoneNumber = ({ pageContentJson }) => {
  return (
    <GcdsDetails detailsTitle={pageContentJson["3"]}>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <GcdsText>{pageContentJson["5"]}</GcdsText>
      <GcdsText>{pageContentJson["6"]}</GcdsText>
      <GcdsText>
        {pageContentJson["7"]}{" "}
        <GcdsLink href="https://accounts.gc.ca/directory">
          {pageContentJson["8"]}
        </GcdsLink>
        .
      </GcdsText>
    </GcdsDetails>
  );
};

const PageHeader = ({ language, pageContentJson }) => {
  return (
    <>
      <GcdsHeading tag="h1" lang={language}>
        {pageContentJson["1"]}
      </GcdsHeading>
      <GcdsText>{pageContentJson["2"]}</GcdsText>
      <ServicesAccessingPhoneNumber pageContentJson={pageContentJson} />
    </>
  );
};

const MyCountryIsNotListed = ({ pageContentJson }) => {
  return (
    <GcdsText>
      <GcdsDetails detailsTitle={pageContentJson["11"]}>
        <GcdsText>
          <span>{pageContentJson["12"]}</span>
        </GcdsText>
      </GcdsDetails>
    </GcdsText>
  );
};

const RadioButtons = ({
  onChangePhoneForm,
  pageContentJson,
  phoneFormData,
  setErrorCode,
}) => {
  const configureRadioOptions = () => {
    let radioOptionsValues = [];

    const smsLabel = `${pageContentJson["7"]}`;
    const smsOtpRadioOption = {
      label: smsLabel,
      id: FLOW_TYPES.sms,
      value: FLOW_TYPES.sms,
      hint: pageContentJson["8"],
      checked: phoneFormData.otpType === FLOW_TYPES.sms,
    };
    radioOptionsValues.push(smsOtpRadioOption);

    const voiceLabel = `${pageContentJson["9"]}`;
    const voiceOtpRadioOption = {
      label: voiceLabel,
      id: FLOW_TYPES.voice,
      value: FLOW_TYPES.voice,
      hint: pageContentJson["10"],
      checked: phoneFormData.otpType === FLOW_TYPES.voice,
    };
    radioOptionsValues.push(voiceOtpRadioOption);

    return radioOptionsValues;
  };

  const radioOptions = configureRadioOptions();
  return (
    <GcdsRadios
      name="radio"
      legend={pageContentJson["5"]}
      hint={pageContentJson["13"]}
      options={radioOptions}
      onGcdsChange={(e) => {
        onChangePhoneForm("otpType", e.target.value);
        // Clear error when user makes selection
        if (setErrorCode) {
          setErrorCode("");
        }
      }}
    ></GcdsRadios>
  );
};

export default function EnterPhoneNumber({
  onNext,
  onCancel,
  onChangePhoneForm,
  phoneFormData,
  errorMessage,
  setErrorCode,
}) {
  const { language } = useParams();
  const [phoneNumberValid, setPhoneNumberValid] = useState(true);
  const pageContentJson = getPageContent(language, PAGES.enterNewPhoneNumber);
  const otpPageContentJson = getPageContent(language, PAGES.otpSelection);

  const { submit, cancel } = getPageContent(language, "Button");

  const isPhoneNumberValid = (phoneNumber, country) => {
    const capitalize = country.toUpperCase();
    const validatedPhoneNumber = isValidPhoneNumber(phoneNumber, capitalize);
    return validatedPhoneNumber;
  };

  return (
    <GcdsContainer>
      <GcdsGrid columns="1" gap="500">
        <section>
          <PageHeader language={language} pageContentJson={pageContentJson} />
        </section>

        <section>
          {errorMessage && (
            <GcdsErrorMessage messageId="message-props">
              {errorMessage}
            </GcdsErrorMessage>
          )}
          <PhoneInput
            inputProps={{
              name: "phone",
              required: true,
              autoFocus: true,
            }}
            specialLabel={pageContentJson["10"]}
            country={"ca"}
            preferredCountries={["ca"]}
            onlyCountries={countryMapping.countries}
            localization={
              language === "fr"
                ? countryMapping.frLocalization
                : countryMapping.localization
            }
            value={phoneFormData.phoneNumber}
            className={"high-res"}
            enableSearch={true}
            countryCodeEditable={false}
            disableSearchIcon={false}
            defaultErrorMessage={pageContentJson["14"]}
            onChange={(phone, country, event, formatted) => {
              onChangePhoneForm("phoneNumber", `+${phone}`);
              onChangePhoneForm("formattedPhoneNumber", formatted);
              const isNumberValid = isPhoneNumberValid(
                phone,
                country.countryCode,
              );
              setPhoneNumberValid(isNumberValid);
              // Clear error when user makes changes
              if (setErrorCode) {
                setErrorCode("");
              }
            }}
            isValid={(inputNumber, country) => {
              return isPhoneNumberValid(inputNumber, country.iso2);
            }}
          />
        </section>

        <section>
          <MyCountryIsNotListed pageContentJson={pageContentJson} />
          <GcdsHeading tag="h3">{pageContentJson["13"]}</GcdsHeading>
          <GcdsText>{pageContentJson["15"]}</GcdsText>
          <RadioButtons
            onChangePhoneForm={onChangePhoneForm}
            pageContentJson={otpPageContentJson}
            phoneFormData={phoneFormData}
            setErrorCode={setErrorCode}
          />
        </section>
      </GcdsGrid>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          disabled={!phoneNumberValid}
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
  );
}
