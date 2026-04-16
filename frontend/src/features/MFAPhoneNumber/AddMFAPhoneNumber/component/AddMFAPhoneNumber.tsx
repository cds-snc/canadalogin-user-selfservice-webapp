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
import { useTranslation } from "react-i18next";
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
  phoneFormData: PhoneFormData;
}

const RadioButtons = ({
  onChangePhoneForm,
  phoneFormData,
}: RadioButtonsProps) => {
  const { t } = useTranslation("mfa");
  // Set up radio buttons
  const configureRadioOptions = (): RadioOption[] => {
    const radioOptionsValues: RadioOption[] = [];

    const smsLabel = `${t("AddMFANumber.textMessage")}`;
    const smsOtpRadioOption: RadioOption = {
      label: smsLabel,
      id: `sms-radio-${FLOW_TYPES.sms}`,
      value: FLOW_TYPES.sms,
      hint: t("AddMFANumber.textMessageHint"),
      checked: phoneFormData.otpType === FLOW_TYPES.sms,
    };
    radioOptionsValues.push(smsOtpRadioOption);

    const voiceLabel = `${t("AddMFANumber.voiceCall")}`;
    const voiceOtpRadioOption: RadioOption = {
      label: voiceLabel,
      id: `voice-radio-${FLOW_TYPES.voice}`,
      value: FLOW_TYPES.voice,
      hint: t("AddMFANumber.voiceCallHint"),
      checked: phoneFormData.otpType === FLOW_TYPES.voice,
    };
    radioOptionsValues.push(voiceOtpRadioOption);

    return radioOptionsValues;
  };

  const radioOptions = configureRadioOptions();
  return (
    <GcdsRadios
      name="radio"
      legend={t("AddMFANumber.howToSendCode")}
      hint={t("AddMFANumber.changeNextSignIn")}
      options={radioOptions}
      required={true}
      onGcdsChange={(e: CustomEvent<string>) => {
        onChangePhoneForm("otpType", (e.target as HTMLInputElement).value);
      }}
    ></GcdsRadios>
  );
};

interface MyCountryIsNotListedProps {}

const MyCountryIsNotListed = ({}: MyCountryIsNotListedProps) => {
  const { t } = useTranslation("mfa");
  return (
    <GcdsText>
      <GcdsDetails detailsTitle={t("AddMFANumber.countryNotListed")}>
        <GcdsText>
          <span>{t("AddMFANumber.countryNotSupported")}</span>
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
  const { t } = useTranslation(["mfa", "common"]);
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
            {t("AddMFANumber.title")}
          </GcdsHeading>
          <GcdsText>{t("AddMFANumber.description")}</GcdsText>
          <GcdsText>
            {t("AddMFANumber.onlyFor2Step")}{" "}
            <GcdsLink href={backtoProfilePage}>
              {t("AddMFANumber.personalInformation")}
            </GcdsLink>{" "}
            {t("AddMFANumber.period")}
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
              specialLabel={t("AddMFANumber.phoneLabel")}
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
              defaultErrorMessage={t("AddMFANumber.voiceCallHint")}
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
          <MyCountryIsNotListed />
          <RadioButtons
            onChangePhoneForm={onChangePhoneForm}
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
          {t("Button.cancel", { ns: "common" })}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
