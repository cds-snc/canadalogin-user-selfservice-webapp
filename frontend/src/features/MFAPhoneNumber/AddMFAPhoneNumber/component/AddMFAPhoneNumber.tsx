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
import { useState } from "react";
import { useParams } from "react-router";
import {
  EXTERNAL_NAVIGATION_LINKS,
  FLOW_TYPES,
  PAGES,
} from "../../../../utils/constants";
import { useTranslation } from "react-i18next";
import { path } from "../../../../utils/routeHelpers";
import SubmitButton from "../../../../components/Layout/SubmitButton";
import {
  CountryPhoneInput,
  type PhoneInputChangePayload,
} from "../../../../components/PhoneInput";

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
  const radioOptions: RadioOption[] = [
    {
      label: t("AddMFANumber.textMessage"),
      id: `sms-radio-${FLOW_TYPES.sms}`,
      value: FLOW_TYPES.sms,
      hint: t("AddMFANumber.textMessageHint"),
      checked: phoneFormData.otpType === FLOW_TYPES.sms,
    },
    {
      label: t("AddMFANumber.voiceCall"),
      id: `voice-radio-${FLOW_TYPES.voice}`,
      value: FLOW_TYPES.voice,
      hint: t("AddMFANumber.voiceCallHint"),
      checked: phoneFormData.otpType === FLOW_TYPES.voice,
    },
  ];

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

const MyCountryIsNotListed = () => {
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
  const privacyNoticeHref =
    language === "fr"
      ? `${EXTERNAL_NAVIGATION_LINKS.CanadaLoginWebsiteProdDomainFR}/utilisateurs/confidentialite/`
      : `${EXTERNAL_NAVIGATION_LINKS.CanadaLoginWebsiteProdDomainEN}/users/privacy/`;

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
    if (!phoneNumberValid || !phoneFormData.phoneNumber) {
      return;
    }
    void doSubmit();
  };

  const onPhoneDataChange = ({
    storedPhoneNumber,
    formattedPhoneNumber,
    isValid,
  }: PhoneInputChangePayload) => {
    onChangePhoneForm("phoneNumber", storedPhoneNumber);
    onChangePhoneForm("formattedPhoneNumber", formattedPhoneNumber);
    setPhoneNumberValid(isValid);
    setErrorCode("");
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
          <GcdsText>
            {t("AddMFANumber.privacyNoticeLead")}{" "}
            <GcdsLink href={privacyNoticeHref} target="_blank">
              {t("AddMFANumber.privacyNoticeLink")}
            </GcdsLink>{" "}
            {t("AddMFANumber.privacyNoticeSuffix")}
          </GcdsText>
        </GcdsContainer>

        <section>
          {errorMessage && (
            <GcdsErrorMessage messageId="message-props">
              {errorMessage}
            </GcdsErrorMessage>
          )}
          <form onSubmit={onSubmitHandler}>
            <CountryPhoneInput
              language={language}
              storedPhoneNumber={phoneFormData.phoneNumber}
              variant="mfa"
              optionIdPrefix="mfa"
              inputId="mfa-phone-number"
              inputName="phone"
              labels={{
                country: t("AddMFANumber.countryLabel"),
                countrySearch: t("AddMFANumber.countrySearchLabel"),
                countryNotSupported: t("AddMFANumber.countryNotSupported"),
                phone: t("AddMFANumber.phoneLabel"),
              }}
              onChange={onPhoneDataChange}
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
          disabled={!phoneNumberValid || !phoneFormData.phoneNumber}
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
