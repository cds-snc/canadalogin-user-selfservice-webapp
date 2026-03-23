import { useEffect, useState } from "react";
import type { FormEventHandler, ReactElement } from "react";
import { useParams } from "react-router";
import { isValidPhoneNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";

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
import { getPageContent } from "../../../utils/functions";
import {
  countryMapping,
  FLOW_TYPES,
  PAGES,
  ServicesWithAccessInfoSectionInformation,
} from "../../../utils/constants";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type {
  ContactPhoneOtpType,
  ContactPhonePageContent,
  ContactPhoneStepProps,
} from "../../../types/contactPhoneNumber";
import { trackButtonClick } from "../../../utils/gatag";

type PhoneInputCountryData = {
  countryCode?: string;
  iso2?: string;
};

type PhoneInputChangeEvent = Event | React.ChangeEvent<HTMLInputElement>;

interface PhoneInputProps {
  inputProps?: Record<string, unknown>;
  specialLabel?: string;
  country?: string;
  preferredCountries?: string[];
  onlyCountries?: string[];
  localization?: Record<string, string>;
  value?: string;
  className?: string;
  enableSearch?: boolean;
  countryCodeEditable?: boolean;
  disableSearchIcon?: boolean;
  defaultErrorMessage?: string;
  onChange?: (
    phone: string,
    country: PhoneInputCountryData,
    event: PhoneInputChangeEvent,
    formattedValue: string,
  ) => void;
  isValid?: (inputNumber: string, country: PhoneInputCountryData) => boolean;
}

const TypedPhoneInput = PhoneInput as unknown as (
  props: PhoneInputProps,
) => ReactElement;

interface PageHeaderProps {
  language: string;
  pageContentJson: ContactPhonePageContent;
}

function PageHeader({ language, pageContentJson }: PageHeaderProps) {
  return (
    <>
      <GcdsHeading tag="h1" lang={language}>
        {pageContentJson["1"]}
      </GcdsHeading>
      <GcdsText>{pageContentJson["2"]}</GcdsText>
      <ServicesWithAccessInfoSection
        currentLang={language}
        information={
          ServicesWithAccessInfoSectionInformation.CONTACT_PHONE_NUMBER
        }
      />
    </>
  );
}

function MyCountryIsNotListed({
  pageContentJson,
}: {
  pageContentJson: ContactPhonePageContent;
}) {
  return (
    <GcdsText>
      <GcdsDetails detailsTitle={pageContentJson["11"]}>
        <GcdsText>
          <span>{pageContentJson["12"]}</span>
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
  pageContentJson: ContactPhonePageContent;
  phoneFormData: ContactPhoneStepProps["phoneFormData"];
  setErrorCode?: ContactPhoneStepProps["setErrorCode"];
}

function RadioButtons({
  onChangePhoneForm,
  pageContentJson,
  phoneFormData,
  setErrorCode,
}: RadioButtonsProps) {
  const radioOptions: RadioOption[] = [
    {
      label: pageContentJson["7"],
      id: FLOW_TYPES.sms,
      value: FLOW_TYPES.sms,
      hint: pageContentJson["8"],
      checked: phoneFormData.otpType === FLOW_TYPES.sms,
    },
    {
      label: pageContentJson["9"],
      id: FLOW_TYPES.voice,
      value: FLOW_TYPES.voice,
      hint: pageContentJson["10"],
      checked: phoneFormData.otpType === FLOW_TYPES.voice,
    },
  ];

  return (
    <GcdsRadios
      name="radio"
      legend={pageContentJson["5"]}
      hint={pageContentJson["13"]}
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
  const [phoneNumberValid, setPhoneNumberValid] = useState(true);
  const pageContentJson =
    (getPageContent(language, PAGES.enterNewPhoneNumber) as
      | ContactPhonePageContent
      | undefined) ?? {};
  const otpPageContentJson =
    (getPageContent(language, PAGES.otpSelection) as
      | ContactPhonePageContent
      | undefined) ?? {};
  const buttonContent =
    (getPageContent(language, "Button") as
      | ContactPhonePageContent
      | undefined) ?? {};

  const validatePhoneNumber = (phoneNumber: string, countryCode?: string) => {
    const normalizedCountryCode = countryCode?.toUpperCase();
    if (!normalizedCountryCode) {
      return false;
    }

    return isValidPhoneNumber(
      phoneNumber,
      normalizedCountryCode as CountryCode,
    );
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
    const addAccessibilityAttributes = () => {
      const countryList = document.querySelector(
        '.country-list[role="listbox"]',
      );
      if (countryList && !countryList.getAttribute("aria-label")) {
        countryList.setAttribute("aria-label", "Countries List");
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          addAccessibilityAttributes();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    addAccessibilityAttributes();

    return () => observer.disconnect();
  }, []);

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="500">
        <section>
          <PageHeader language={language} pageContentJson={pageContentJson} />
        </section>

        <form onSubmit={onSubmitHandler}>
          <section>
            {errorMessage ? (
              <GcdsErrorMessage messageId="message-props">
                {errorMessage}
              </GcdsErrorMessage>
            ) : null}{" "}
            <TypedPhoneInput
              inputProps={{
                name: "phone",
                required: true,
                autoFocus: true,
              }}
              specialLabel={pageContentJson["10"]}
              country="ca"
              preferredCountries={["ca"]}
              onlyCountries={countryMapping.countries as unknown as string[]}
              localization={
                language === "fr"
                  ? (countryMapping.frLocalization as Record<string, string>)
                  : (countryMapping.localization as Record<string, string>)
              }
              value={phoneFormData.phoneNumber}
              className="high-res"
              enableSearch
              countryCodeEditable={false}
              disableSearchIcon={false}
              defaultErrorMessage={pageContentJson["14"]}
              onChange={(phone, country, _event, formatted) => {
                onChangePhoneForm("phoneNumber", `+${phone}`);
                onChangePhoneForm("formattedPhoneNumber", formatted);

                const isNumberValid = validatePhoneNumber(
                  phone,
                  country.countryCode,
                );
                setPhoneNumberValid(isNumberValid);
                setErrorCode?.("");
              }}
              isValid={(inputNumber, country) => {
                return validatePhoneNumber(inputNumber, country.iso2);
              }}
            />
          </section>
        </form>

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
          {buttonContent.cancel}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
