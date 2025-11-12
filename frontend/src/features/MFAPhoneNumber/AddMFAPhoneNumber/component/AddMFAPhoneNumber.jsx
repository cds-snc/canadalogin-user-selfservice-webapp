import {
  GcdsButton,
  GcdsContainer,
  GcdsDetails,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsRadios,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useState } from "react";
import PhoneInput from "react-phone-input-2";
import { useParams } from "react-router";
import { countryMapping, FLOW_TYPES, PAGES } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";
import { path } from "../../../../utils/routeHelpers";

const RadioButtons = ({
  onChangePhoneForm,
  pageContentJson,
  phoneFormData,
}) => {
  const configureRadioOptions = () => {
    let radioOptionsValues = [];

    const smsLabel = `${pageContentJson["11"]}`;
    const smsOtpRadioOption = {
      label: smsLabel,
      id: `sms-radio-${FLOW_TYPES.sms}`,
      value: FLOW_TYPES.sms,
      hint: pageContentJson["12"],
      checked: phoneFormData.otpType === FLOW_TYPES.sms,
    };
    radioOptionsValues.push(smsOtpRadioOption);

    const voiceLabel = `${pageContentJson["13"]}`;
    const voiceOtpRadioOption = {
      label: voiceLabel,
      id: `voice-radio-${FLOW_TYPES.voice}`,
      value: FLOW_TYPES.voice,
      hint: pageContentJson["14"],
      checked: phoneFormData.otpType === FLOW_TYPES.voice,
    };
    radioOptionsValues.push(voiceOtpRadioOption);

    return radioOptionsValues;
  };

  const radioOptions = configureRadioOptions();
  return (
    <GcdsRadios
      aria-label={pageContentJson["10"]}
      name="radio"
      legend={pageContentJson["10"]}
      hint={pageContentJson["15"]}
      options={radioOptions}
      required={true}
      onGcdsChange={(e) => {
        onChangePhoneForm("otpType", e.target.value);
      }}
    ></GcdsRadios>
  );
};

const MyCountryIsNotListed = ({ pageContentJson }) => {
  return (
    <GcdsText>
      <GcdsDetails detailsTitle={pageContentJson["8"]}>
        <GcdsText>
          <span>{pageContentJson["9"]}</span>
        </GcdsText>
      </GcdsDetails>
    </GcdsText>
  );
};

export default function AddMFAPhoneNumber({
  onNext,
  onCancel,
  onChangePhoneForm,
  phoneFormData,
  setErrorCode,
  errorMessage,
}) {
  const { language } = useParams();
  const [phoneNumberValid, setPhoneNumberValid] = useState(true);
  const pageContentJson = getPageContent(language, PAGES.addMFANumber);
  const { submit, cancel } = getPageContent(language, "Button");
  const backtoProfilePage = path(PAGES.ProfileHome, { language: language });

  const isPhoneNumberValid = (phoneNumber, country) => {
    const capitalize = country.toUpperCase();
    const validatedPhoneNumber = isValidPhoneNumber(phoneNumber, capitalize);
    return validatedPhoneNumber;
  };

  return (
    <GcdsContainer>
      <GcdsGrid columns="1" gap="500">
        <GcdsContainer>
          <GcdsHeading tag="h1" lang={language}>
            {pageContentJson["1"]}
          </GcdsHeading>
          <GcdsText>{pageContentJson["2"]}</GcdsText>
          <GcdsText>
            {pageContentJson["3"]}{" "}
            <GcdsLink href={backtoProfilePage}>{pageContentJson["4"]}</GcdsLink>{" "}
            {pageContentJson["5"]}
          </GcdsText>
        </GcdsContainer>

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
            specialLabel={pageContentJson["7"]}
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
            }}
            isValid={(inputNumber, country) => {
              return isPhoneNumberValid(inputNumber, country.iso2);
            }}
          />
        </section>

        <section>
          <MyCountryIsNotListed pageContentJson={pageContentJson} />
          <RadioButtons
            onChangePhoneForm={onChangePhoneForm}
            pageContentJson={pageContentJson}
            phoneFormData={phoneFormData}
          />
        </section>
      </GcdsGrid>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          disabled={!phoneNumberValid}
          style={{ width: "fit-content" }}
          onGcdsClick={async (ev) => {
            ev.preventDefault();
            try {
              setErrorCode("");
              await onNext();
            } catch (error) {
              // Handle validation errors
              if (error?.data?.message) {
                setErrorCode(error.data.message);
              }
            }
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
