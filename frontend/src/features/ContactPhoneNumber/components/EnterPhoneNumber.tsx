import { useState } from "react";
import type { FormEventHandler } from "react";
import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsDetails,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsRadios,
  GcdsText,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import {
  FLOW_TYPES,
  ServicesWithAccessInfoSectionInformation,
} from "../../../utils/constants";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection";
import SubmitButton from "../../../components/Layout/SubmitButton";
import {
  CountryPhoneInput,
  type PhoneInputChangePayload,
} from "../../../components/PhoneInput";
import type {
  ContactPhoneOtpType,
  ContactPhoneStepProps,
} from "../../../types/contactPhoneNumber";
import { trackButtonClick } from "../../../utils/gatag";

interface PageHeaderProps {
  language: string;
}

function PageHeader({ language }: PageHeaderProps) {
  const { t } = useTranslation("phone");
  return (
    <>
      <GcdsHeading tag="h1" lang={language}>
        {t("EnterNewPhoneNumber.title")}
      </GcdsHeading>
      <GcdsText>{t("EnterNewPhoneNumber.description")}</GcdsText>
      <ServicesWithAccessInfoSection
        currentLang={language}
        information={
          ServicesWithAccessInfoSectionInformation.CONTACT_PHONE_NUMBER
        }
      />
    </>
  );
}

function MyCountryIsNotListed() {
  const { t } = useTranslation("phone");
  return (
    <GcdsText>
      <GcdsDetails detailsTitle={t("EnterNewPhoneNumber.countryNotListed")}>
        <GcdsText>
          <span>{t("EnterNewPhoneNumber.countryNotSupported")}</span>
        </GcdsText>
      </GcdsDetails>
    </GcdsText>
  );
}

type RadioOption = {
  label: string;
  id: ContactPhoneOtpType;
  value: ContactPhoneOtpType;
  hint: string;
  checked: boolean;
};

interface RadioButtonsProps {
  onChangePhoneForm: ContactPhoneStepProps["onChangePhoneForm"];
  phoneFormData: ContactPhoneStepProps["phoneFormData"];
  setErrorCode?: ContactPhoneStepProps["setErrorCode"];
}

function RadioButtons({
  onChangePhoneForm,
  phoneFormData,
  setErrorCode,
}: RadioButtonsProps) {
  const { t } = useTranslation("security");
  const radioOptions: RadioOption[] = [
    {
      label: t("OtpSelection.textMessage"),
      id: FLOW_TYPES.sms,
      value: FLOW_TYPES.sms,
      hint: t("OtpSelection.mobileOnly"),
      checked: phoneFormData.otpType === FLOW_TYPES.sms,
    },
    {
      label: t("OtpSelection.voiceCall"),
      id: FLOW_TYPES.voice,
      value: FLOW_TYPES.voice,
      hint: t("OtpSelection.mobileOrLandline"),
      checked: phoneFormData.otpType === FLOW_TYPES.voice,
    },
  ];

  return (
    <GcdsRadios
      name="radio"
      legend={t("OtpSelection.howToSendCode")}
      hint={t("OtpSelection.carrierCharges")}
      options={radioOptions}
      onGcdsChange={(event: Event) => {
        const target = event.target as HTMLInputElement;
        const selectedType = target.value as ContactPhoneOtpType;

        // Track OTP type selection
        trackButtonClick(`otp_type_${selectedType}`, {
          form_id: "contact_phone_number_update",
          selection_type: selectedType,
        });

        onChangePhoneForm("otpType", selectedType);
        setErrorCode?.("");
      }}
    />
  );
}

export default function EnterPhoneNumber({
  onNext,
  onCancel,
  onChangePhoneForm,
  phoneFormData,
  errorMessage,
  setErrorCode,
}: ContactPhoneStepProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const { t } = useTranslation(["phone", "security", "common"]);
  const [phoneNumberValid, setPhoneNumberValid] = useState(true);

  const onSubmitHandler: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!phoneNumberValid || !phoneFormData.phoneNumber) {
      return;
    }
    await onNext();
  };

  const onSubmitClick = (event: CustomEvent<string | void>) => {
    event.preventDefault();
    void onNext();
  };

  const onPhoneDataChange = ({
    storedPhoneNumber,
    formattedPhoneNumber,
    isValid,
  }: PhoneInputChangePayload) => {
    onChangePhoneForm("phoneNumber", storedPhoneNumber);
    onChangePhoneForm("formattedPhoneNumber", formattedPhoneNumber);
    setPhoneNumberValid(isValid);
    setErrorCode?.("");
  };

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="150">
        <section>
          <PageHeader language={language} />
        </section>

        <form onSubmit={onSubmitHandler}>
          <section>
            <GcdsHeading tag="h2" marginTop="0">
              {t("EnterNewPhoneNumber.enterNewNumberHeading")}
            </GcdsHeading>
            {errorMessage ? (
              <GcdsErrorMessage messageId="message-props">
                {errorMessage}
              </GcdsErrorMessage>
            ) : null}
            <CountryPhoneInput
              language={language}
              storedPhoneNumber={phoneFormData.phoneNumber}
              variant="contact"
              optionIdPrefix="cp"
              inputId="cp-phone-number"
              inputName="phone"
              labels={{
                country: t("EnterNewPhoneNumber.countryLabel"),
                countrySearch: t("EnterNewPhoneNumber.countrySearchLabel"),
                countryNotSupported: t(
                  "EnterNewPhoneNumber.countryNotSupported",
                ),
                phone: t("EnterNewPhoneNumber.phoneLabel"),
              }}
              onChange={onPhoneDataChange}
            />
          </section>
          <MyCountryIsNotListed />
        </form>

        <section>
          <GcdsHeading tag="h2" marginTop="0">
            {t("EnterNewPhoneNumber.verifyNumber")}
          </GcdsHeading>
          <GcdsText>{t("EnterNewPhoneNumber.verifyDescription")}</GcdsText>
          <RadioButtons
            onChangePhoneForm={onChangePhoneForm}
            phoneFormData={phoneFormData}
            setErrorCode={setErrorCode}
          />
        </section>
      </GcdsGrid>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          disabled={!phoneNumberValid || !phoneFormData.phoneNumber}
          style={{ width: "fit-content" }}
          onGcdsClick={onSubmitClick}
          currentLang={language}
        />

        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={(event: Event) => {
            event.preventDefault();
            trackButtonClick("cancel_phone_update", {
              form_id: "contact_phone_number_update",
              step: "enter_phone",
            });
            void onCancel();
          }}
        >
          {t("Button.cancel", { ns: "common" })}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
