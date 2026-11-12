import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsSelect,
} from "@gcds-core/components-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";

import ErrorSummaryWithFocus from "../../../components/ErrorSummaryWithFocus/ErrorSummaryWithFocus";
import { inPersonIdentityVerificationApi } from "../api/inPersonIdentityVerificationApi";
import {
  AVAILABLE_LANGUAGES,
  CANADIAN_PROVINCES_AND_TERRITORIES,
  DEV_ONLY_FEATURE,
  PAGES,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import type { ApprovedDocumentValue } from "../data/approvedDocuments";
import IdentityApplicantFields from "./IdentityApplicantFields";
import {
  getAddressRequiredMessage,
  getCityRequiredMessage,
  getFirstNameRequiredOrInvalidMessage,
  getIdExpiryInvalidMessage,
  getIdExpiryRequiredMessage,
  getIdExpiryTooSoonMessage,
  getLastNameRequiredOrInvalidMessage,
  getPostalCodeRequiredOrInvalidMessage,
  getProvinceRequiredMessage,
  getSharedDateOfBirthMessages,
  getValidationSummaryHeading,
} from "./validation/ErrorsDefinition";
import { formatDateOfBirthForDisplay } from "./validation/InPersonIdentity.validation";
import {
  type CanadaPostIdDetailsErrorCodes,
  type CanadaPostIdDetailsFormData,
  getCanadaPostIdDetailsValidation,
} from "./validation/CanadaPostIdDetails.validation";

const ERROR_SUMMARY_ID = "service-canada-centre-id-details-error-summary";
const CANADA_COUNTRY_CODE = "CA";
const FIELD_IDS: Record<keyof CanadaPostIdDetailsErrorCodes, string> = {
  idExpiryDate: "id-expiry-date-input",
  documentOptionId: "select-document-option",
  country: "select-country",
  province: "select-province",
  firstName: "first-name-input",
  lastName: "last-name-input",
  dateOfBirth: "date-of-birth-input",
  address: "address-input",
  cityTown: "city-town-input",
  postalCode: "postal-code-input",
};

type ServiceCanadaCentreIdDetailsLocationState = {
  idType?: ApprovedDocumentValue;
  formData?: CanadaPostIdDetailsFormData;
};

export default function ServiceCanadaCentreIdDetailsPage() {
  const { t } = useTranslation("idv");
  const navigate = useNavigate();
  const location = useLocation();
  const { language, journeyType } = useParams();
  const currentLanguage =
    language === AVAILABLE_LANGUAGES.fr
      ? AVAILABLE_LANGUAGES.fr
      : AVAILABLE_LANGUAGES.en;
  const locationState =
    location.state as ServiceCanadaCentreIdDetailsLocationState | null;
  const idType = locationState?.idType;
  const serviceCanadaCentrePage = path(PAGES.idvServiceCanadaCentrePage, {
    language,
    journeyType,
  });
  const serviceCanadaCodePage = path(PAGES.idvServiceCanadaCentreCodePage, {
    language,
    journeyType,
  });
  const [formData, setFormData] = useState<CanadaPostIdDetailsFormData>(() => ({
    idExpiryDate: "",
    documentOptionId: idType ?? "",
    country: CANADA_COUNTRY_CODE,
    province: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    address: "",
    cityTown: "",
    postalCode: "",
    ...locationState?.formData,
  }));
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [summaryFocusTrigger, setSummaryFocusTrigger] = useState(0);

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  if (!idType) {
    return <Navigate to={serviceCanadaCentrePage} replace />;
  }

  const isDriverLicence = idType === "driverLicence";
  const isPassport = idType === "passport";
  const showAddressFields =
    isDriverLicence ||
    idType === "photoIDHealthCard" ||
    idType === "photoIDServiceCard";
  const requiresIdExpiry = !isDriverLicence && !isPassport;
  const { isFormValid, errorCodes } = getCanadaPostIdDetailsValidation(
    formData,
    {
      showCountry: false,
      showProvince: isDriverLicence,
      requireIdExpiry: requiresIdExpiry,
      requireAddress: isDriverLicence,
    },
  );
  const dobMessages = getSharedDateOfBirthMessages(t);
  const errorMessages: Record<keyof CanadaPostIdDetailsErrorCodes, string> = {
    idExpiryDate:
      errorCodes.idExpiryDate === "too_soon"
        ? getIdExpiryTooSoonMessage(t)
        : errorCodes.idExpiryDate === "invalid"
          ? getIdExpiryInvalidMessage(t)
          : getIdExpiryRequiredMessage(t),
    documentOptionId: getIdExpiryRequiredMessage(t),
    country: getProvinceRequiredMessage(t),
    province: getProvinceRequiredMessage(t),
    firstName: getFirstNameRequiredOrInvalidMessage(t),
    lastName: getLastNameRequiredOrInvalidMessage(t),
    dateOfBirth: errorCodes.dateOfBirth
      ? dobMessages[errorCodes.dateOfBirth].summary
      : "",
    address: getAddressRequiredMessage(t),
    cityTown: getCityRequiredMessage(t),
    postalCode: getPostalCodeRequiredOrInvalidMessage(t),
  };
  const fieldError = (field: keyof CanadaPostIdDetailsErrorCodes) =>
    hasSubmitted && errorCodes[field] ? errorMessages[field] : "";
  const summaryErrors = Object.fromEntries(
    (Object.keys(FIELD_IDS) as (keyof CanadaPostIdDetailsErrorCodes)[])
      .filter((field) => errorCodes[field])
      .map((field) => [`#${FIELD_IDS[field]}`, errorMessages[field]]),
  );
  const updateField =
    (field: keyof CanadaPostIdDetailsFormData) => (event: CustomEvent) => {
      const target = event.target as
        HTMLInputElement | HTMLSelectElement | null;
      setFormData((previous) => ({
        ...previous,
        [field]: target?.value ?? "",
      }));
    };

  const onContinue = async () => {
    setHasSubmitted(true);
    if (!isFormValid) {
      setSummaryFocusTrigger((previous) => previous + 1);
      return;
    }

    const response =
      await inPersonIdentityVerificationApi.sendInPersonVerificationCode({
        verificationProvider: "service_canada",
        applicant: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          ...(showAddressFields && formData.address.trim()
            ? {
                address: {
                  streetAddress: formData.address,
                  locality: formData.cityTown,
                  region: formData.province,
                  postalCode: formData.postalCode,
                  country: CANADA_COUNTRY_CODE,
                },
              }
            : {}),
          ...(requiresIdExpiry ? { idExpiryDate: formData.idExpiryDate } : {}),
          idType,
        },
      });

    if (!response?.data?.verificationCode) {
      return;
    }

    navigate(serviceCanadaCodePage, {
      state: {
        idvCode: response.data.verificationCode,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formatDateOfBirthForDisplay(
          formData.dateOfBirth,
          currentLanguage,
        ),
        idType,
        verificationExpiresAt: response.data.verificationExpiresAt,
        verificationValidityDays: response.data.verificationValidityDays,
      },
    });
  };

  const provinceSelect = showAddressFields ? (
    <GcdsSelect
      id={FIELD_IDS.province}
      selectId={FIELD_IDS.province}
      name={FIELD_IDS.province}
      label={t("ServiceCanadaCentre.provinceLabel")}
      lang={currentLanguage}
      value={formData.province}
      defaultValue={t("ServiceCanadaCentre.selectIdDropdownDefaultValue")}
      required={isDriverLicence}
      errorMessage={isDriverLicence ? fieldError("province") : ""}
      onGcdsChange={updateField("province")}
    >
      <option value="">
        {t("ServiceCanadaCentre.selectIdDropdownDefaultValue")}
      </option>
      {CANADIAN_PROVINCES_AND_TERRITORIES.map((province) => (
        <option key={province.code} value={province.code}>
          {province.labels[currentLanguage]}
        </option>
      ))}
    </GcdsSelect>
  ) : null;

  return (
    <GcdsContainer role="main">
      <form>
        <GcdsGrid columns="1" gap="450">
          <GcdsContainer>
            <GcdsHeading tag="h1">
              {isDriverLicence
                ? "Enter your driver licence details"
                : isPassport
                  ? "Enter your passport details"
                  : t("ServiceCanadaCentre.enterDetailsHeading")}
            </GcdsHeading>
            {hasSubmitted && !isFormValid ? (
              <ErrorSummaryWithFocus
                key={summaryFocusTrigger}
                id={ERROR_SUMMARY_ID}
                errorMessage={getValidationSummaryHeading(t)}
                errorLinks={summaryErrors}
                language={currentLanguage}
              />
            ) : null}
          </GcdsContainer>

          <GcdsContainer>
            <IdentityApplicantFields
              formData={formData}
              currentLanguage={currentLanguage}
              labels={{
                idExpiry: t("ServiceCanadaCentre.idExpirationLabel"),
                idExpiryHint: t("ServiceCanadaCentre.idExpiryHint"),
                firstName: t("ServiceCanadaCentre.firstNameLabel"),
                firstNameHint: t("ServiceCanadaCentre.firstNameHint"),
                lastName: t("ServiceCanadaCentre.lastNameLabel"),
                lastNameHint: t("ServiceCanadaCentre.lastNameHint"),
                dateOfBirth: t("ServiceCanadaCentre.dateOfBirthdayLabel"),
                address: t("ServiceCanadaCentre.addressLabel"),
                addressHint: t("ServiceCanadaCentre.addressHint"),
                cityTown: t("ServiceCanadaCentre.cityTownLabel"),
                postalCode: t("ServiceCanadaCentre.postalcodeLabel"),
                postalCodeHint: t("ServiceCanadaCentre.postalcodeHint"),
              }}
              fieldError={fieldError}
              dateOfBirthError={
                hasSubmitted && errorCodes.dateOfBirth
                  ? dobMessages[errorCodes.dateOfBirth].inline
                  : ""
              }
              showIdExpiry={requiresIdExpiry}
              showAddressFields={showAddressFields}
              requireAddressFields={isDriverLicence}
              updateField={updateField}
              provinceField={provinceSelect}
            />
          </GcdsContainer>

          <GcdsGrid
            columns="1"
            columnsDesktop="max-content max-content"
            gap="200"
          >
            <GcdsButton
              type="button"
              onGcdsClick={(event: Event) => {
                event.preventDefault();
                void onContinue();
              }}
            >
              {t("ServiceCanadaCentre.continueButton")}
            </GcdsButton>
            <GcdsButton
              type="button"
              buttonRole="secondary"
              onGcdsClick={(event: Event) => {
                event.preventDefault();
                navigate(-1);
              }}
            >
              {t("ServiceCanadaCentre.backButton")}
            </GcdsButton>
          </GcdsGrid>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}
