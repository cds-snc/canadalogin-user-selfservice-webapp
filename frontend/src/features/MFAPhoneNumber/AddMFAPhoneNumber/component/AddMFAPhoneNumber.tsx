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
} from "@gcds-core/components-react";
import { isValidPhoneNumber, CountryCode } from "libphonenumber-js";
import { useState } from "react";
import PhoneInput from "react-phone-input-2";
import { useParams } from "react-router";
import { countryMapping, FLOW_TYPES, PAGES } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";
import { path } from "../../../../utils/routeHelpers";
import SubmitButton from "../../../../components/Layout/SubmitButton";

interface PhoneFormData {
  phoneNumber: string;
  otp: string;
  mfaId: string;
  trxnId: string;
  otpType: string;
  formattedPhoneNumber: string;
}

interface RadioOption {
  label: string;
  id: string;
  value: string;
  hint: string;
  checked: boolean;
}

interface RadioButtonsProps {
  onChangePhoneForm: (field: string, value: string) => void;
  pageContentJson: Record<string, string>;
  phoneFormData: PhoneFormData;
}

const RadioButtons = ({
  onChangePhoneForm,
  pageContentJson,
  phoneFormData,
}: RadioButtonsProps) => {
  // Set up radio buttons
  const configureRadioOptions = (): RadioOption[] => {
    const radioOptionsValues: RadioOption[] = [];

    const smsLabel = `${pageContentJson["11"]}`;
    const smsOtpRadioOption: RadioOption = {
      label: smsLabel,
      id: `sms-radio-${FLOW_TYPES.sms}`,
      value: FLOW_TYPES.sms,
      hint: pageContentJson["12"],
      checked: phoneFormData.otpType === FLOW_TYPES.sms,
    };
    radioOptionsValues.push(smsOtpRadioOption);

    const voiceLabel = `${pageContentJson["13"]}`;
    const voiceOtpRadioOption: RadioOption = {
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
      name="radio"
      legend={pageContentJson["10"]}
      hint={pageContentJson["15"]}
      options={radioOptions}
      required={true}
      onGcdsChange={(e: CustomEvent<string>) => {
        onChangePhoneForm("otpType", (e.target as HTMLInputElement).value);
      }}
    ></GcdsRadios>
  );
};

interface MyCountryIsNotListedProps {
  pageContentJson: Record<string, string>;
}

const MyCountryIsNotListed = ({
  pageContentJson,
}: MyCountryIsNotListedProps) => {
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

interface AddMFAPhoneNumberProps {
  onNext: () => Promise<void>;
  onCancel: () => Promise<void>;
  onChangePhoneForm: (field: string, value: string) => void;
  phoneFormData: PhoneFormData;
  setErrorCode: (code: string) => void;
  errorMessage: string;
}

export default function AddMFAPhoneNumber({
  onNext,
  onCancel,
  onChangePhoneForm,
  phoneFormData,
  setErrorCode,
  errorMessage,
}: AddMFAPhoneNumberProps) {
  const { language } = useParams();
  const [phoneNumberValid, setPhoneNumberValid] = useState(true);
  const pageContentJson = getPageContent(language, PAGES.addMFANumber)!;
  const { cancel } = getPageContent(language, "Button")!;
  const backtoProfilePage = path(PAGES.ProfileHome, { language: language });

  const isPhoneNumberValid = (phoneNumber: string, country: string) => {
    const capitalize = country.toUpperCase() as CountryCode;
    const validatedPhoneNumber = isValidPhoneNumber(phoneNumber, capitalize);
    return validatedPhoneNumber;
  };

  const doSubmit = async () => {
    try {
      setErrorCode("");
      await onNext();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      if (err?.data?.message) {
        setErrorCode(err.data.message);
      }
    }
  };

  const onSubmitHandler: React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    void doSubmit();
  };

  return (
    <GcdsContainer role="main">
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
          <form onSubmit={onSubmitHandler}>
            <PhoneInput
              inputProps={{
                name: "phone",
                required: true,
                autoFocus: true,
              }}
              specialLabel={pageContentJson["7"]}
              country={"ca"}
              preferredCountries={["ca"]}
              onlyCountries={countryMapping.countries as unknown as string[]}
              localization={
                language === "fr"
                  ? countryMapping.frLocalization
                  : countryMapping.localization
              }
              value={phoneFormData.phoneNumber}
              enableSearch={true}
              countryCodeEditable={false}
              disableSearchIcon={false}
              defaultErrorMessage={pageContentJson["14"]}
              onChange={(
                phone: string,
                country: { countryCode?: string; iso2?: string },
                _event: React.ChangeEvent<HTMLInputElement>,
                formatted: string,
              ) => {
                onChangePhoneForm("phoneNumber", `+${phone}`);
                onChangePhoneForm("formattedPhoneNumber", formatted);
                const isNumberValid = isPhoneNumberValid(
                  phone,
                  country.countryCode ?? "",
                );
                setPhoneNumberValid(isNumberValid);
              }}
              isValid={(inputNumber: string, country: { iso2?: string }) => {
                return isPhoneNumberValid(inputNumber, country.iso2 ?? "");
              }}
            />
          </form>
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
        <SubmitButton
          disabled={!phoneNumberValid}
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            void doSubmit();
          }}
          currentLang={language ?? "en"}
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
  );
}
