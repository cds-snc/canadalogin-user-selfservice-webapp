import {
  GcdsButton,
  GcdsContainer,
  GcdsDateInput,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsSelect,
  GcdsText,
} from "@gcds-core/components-react";
import { type CSSProperties, useMemo, useState } from "react";
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
import type { IdentityDocument } from "../api/identityDocumentsApi";
import {
  getIdDetailsFormVariant,
  getSimpleIdName,
} from "../data/identityDocuments";
import useGcdsSelectWidth from "../helpers/useGcdsSelectWidth";
import { formatDateOfBirthForDisplay } from "./validation/InPersonIdentity.validation";
import {
  type CanadaPostIdDetailsErrorCodes,
  type CanadaPostIdDetailsFormData,
  getCanadaPostIdDetailsValidation,
} from "./validation/CanadaPostIdDetails.validation";
import {
  getAddressRequiredMessage,
  getCityRequiredMessage,
  getCountryRequiredMessage,
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

const ERROR_SUMMARY_ID = "canada-post-id-details-error-summary";
const CANADA_COUNTRY_CODE = "CA";
const ID_TYPE_BY_DOCUMENT: Record<IdentityDocument["key"], string> = {
  DRIVERS_LICENCE: "driverLicence",
  PASSPORT: "passport",
  PROVINCIAL_PHOTO_ID: "photoIDServiceCard",
  PROVINCIAL_HEALTH_CARD: "photoIDHealthCard",
  PERMANENT_RESIDENT_CARD: "canadianPRCard",
  INDIAN_STATUS_CARD: "indianStatus",
  COMBO_CARD: "COMBO_CARD",
};

const ADDRESS_FIELD_SPACING = {
  "--gcds-input-margin": "0 0 2.5rem",
  "--gcds-select-margin": "0 0 2.5rem",
} as CSSProperties;

const DATE_INPUT_NO_TRAILING_SPACE = {
  "--gcds-input-margin": "0",
  "--gcds-select-margin": "0",
} as CSSProperties;

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

export interface CanadaPostIdDetailsLocationState {
  document?: IdentityDocument;
  formData?: CanadaPostIdDetailsFormData;
  proofOfAddressAcknowledged?: boolean;
  proofOfAddress?: string;
  idDetails?: CanadaPostIdDetailsFormData;
  showIdDetails?: boolean;
}

export default function CanadaPostIdDetailsPage() {
  const { t } = useTranslation("idv");
  const navigate = useNavigate();
  const location = useLocation();
  const { language, journeyType } = useParams();
  const currentLanguage =
    language === AVAILABLE_LANGUAGES.fr
      ? AVAILABLE_LANGUAGES.fr
      : AVAILABLE_LANGUAGES.en;

  const locationState =
    location.state as CanadaPostIdDetailsLocationState | null;
  const selectedDocument = locationState?.document;

  const variant = selectedDocument
    ? getIdDetailsFormVariant(selectedDocument.key)
    : "default";
  // Show province for all document types
  const showProvince = true;

  const [formData, setFormData] = useState<CanadaPostIdDetailsFormData>(() => ({
    documentOptionId:
      variant === "passport"
        ? String(
            selectedDocument?.options.find(
              (option) => option.country_code === CANADA_COUNTRY_CODE,
            )?.id ??
              selectedDocument?.options[0]?.id ??
              "",
          )
        : selectedDocument?.options.length === 1
          ? String(selectedDocument.options[0].id)
          : "",
    country: CANADA_COUNTRY_CODE,
    province: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    address: "",
    cityTown: "",
    postalCode: "",
    ...locationState?.formData,
    ...locationState?.idDetails,
  }));
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [summaryFocusTrigger, setSummaryFocusTrigger] = useState(0);

  const selectElementIds = useMemo(
    () =>
      [
        FIELD_IDS.documentOptionId,
        showProvince ? FIELD_IDS.province : null,
      ].filter((id): id is string => id !== null),
    [showProvince],
  );
  useGcdsSelectWidth(selectElementIds);

  const selectIdPage = path(PAGES.idvVisitCanadaPostPage, {
    language,
    journeyType,
  });

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  if (!selectedDocument) {
    return <Navigate to={selectIdPage} replace />;
  }

  const { isFormValid, errorCodes } = getCanadaPostIdDetailsValidation(
    formData,
    { showProvince },
  );

  const dobMessages = getSharedDateOfBirthMessages(t);
  const errorMessages: Partial<Record<keyof CanadaPostIdDetailsErrorCodes, string>> = {
    idExpiryDate:
      errorCodes.idExpiryDate === "too_soon"
        ? getIdExpiryTooSoonMessage(t)
        : errorCodes.idExpiryDate === "invalid"
          ? getIdExpiryInvalidMessage(t)
          : getIdExpiryRequiredMessage(t),
    country: getCountryRequiredMessage(t),
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
      .filter((field) => field !== "documentOptionId" && errorCodes[field] && errorMessages[field])
      .map((field) => [`#${FIELD_IDS[field]}`, errorMessages[field]!]),
  );

  const updateField =
    (field: keyof CanadaPostIdDetailsFormData) => (event: CustomEvent) => {
      const target = event.target as
        HTMLInputElement | HTMLSelectElement | null;
      const value = target?.value ?? "";
      setFormData((previous) => ({ ...previous, [field]: value }));
    };

  const selectedOption = selectedDocument.options.find(
    (option) => String(option.id) === formData.documentOptionId,
  );

  const onContinue = async () => {
    setHasSubmitted(true);

    if (!isFormValid) {
      // Re-trigger focus/scroll if user submits invalid data multiple times.
      setSummaryFocusTrigger((previous) => previous + 1);
      return;
    }

    if (
      selectedOption?.requires_proof &&
      !locationState?.proofOfAddressAcknowledged
    ) {
      navigate(
        path(PAGES.idvCanadaPostProofOfAddressPage, { language, journeyType }),
        { state: { document: selectedDocument, formData, proofOfAddress: locationState?.proofOfAddress } },
      );
      return;
    }

    const response =
      await inPersonIdentityVerificationApi.sendInPersonVerificationCode({
        verificationProvider: "canada_post",
        applicant: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          address: {
            streetAddress: formData.address,
            locality: formData.cityTown,
            region:
              formData.province || selectedOption?.province_code || undefined,
            postalCode: formData.postalCode,
            country:
              variant === "passport"
                ? CANADA_COUNTRY_CODE
                : formData.country || CANADA_COUNTRY_CODE,
          },
          idType: ID_TYPE_BY_DOCUMENT[selectedDocument.key],
        },
      });

    if (!response?.success) {
      return;
    }

    navigate(
      path(PAGES.idvProofingBarcodeCanadaPostPage, { language, journeyType }),
      {
        state: {
          idvCode: response.data?.verificationCode,
          givenName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formatDateOfBirthForDisplay(
            formData.dateOfBirth,
            currentLanguage,
          ),
          idSelected: ID_TYPE_BY_DOCUMENT[selectedDocument.key],
          verificationExpiresAt: response.data.verificationExpiresAt,
          verificationValidityDays: response.data.verificationValidityDays,
          proofOfAddressRequired: selectedOption?.requires_proof === true,
          verificationMethod: "canada_post",
          idDetails: formData,
          document: selectedDocument,
          proofOfAddress: locationState?.proofOfAddress,
        },
      },
    );
  };

  const headingKey =
    variant === "passport"
      ? "CanadaPostIdDetails.passportHeading"
      : variant === "driverLicence"
        ? "CanadaPostIdDetails.driverLicenceHeading"
        : "CanadaPostIdDetails.defaultHeading";

  const provinceSelect = (
    <GcdsSelect
      id={FIELD_IDS.province}
      style={ADDRESS_FIELD_SPACING}
      selectId={FIELD_IDS.province}
      name={FIELD_IDS.province}
      label={t("CanadaPostIdDetails.provinceLabel")}
      lang={currentLanguage}
      value={formData.province}
      defaultValue={t("CanadaPostIdDetails.selectDefaultValue")}
      required
      errorMessage={fieldError("province")}
      onGcdsChange={updateField("province")}
    >
      {CANADIAN_PROVINCES_AND_TERRITORIES.map((province) => (
        <option key={province.code} value={province.code}>
          {province.labels[currentLanguage]}
        </option>
      ))}
    </GcdsSelect>
  );

  return (
    <GcdsContainer role="main">
      <form>
        <GcdsGrid columns="1" gap="450">
          <GcdsContainer>
            <GcdsHeading tag="h1">
              {selectedDocument
                ? `Enter your ${getSimpleIdName(selectedDocument.key, currentLanguage)} details`
                : t(headingKey)}
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
            <GcdsInput
              id={FIELD_IDS.firstName}
              inputId={FIELD_IDS.firstName}
              name={FIELD_IDS.firstName}
              lang={currentLanguage}  
              label={t("VisitCanadaPost.givenNameLabel")}
              hint={t("VisitCanadaPost.givenNameHint")}
              value={formData.firstName}
              required
              errorMessage={fieldError("firstName")}
              onGcdsChange={updateField("firstName")}
            />

            <GcdsInput
              id={FIELD_IDS.lastName}
              inputId={FIELD_IDS.lastName}
              name={FIELD_IDS.lastName}
              lang={currentLanguage}
              label={t("VisitCanadaPost.familyNameLabel")}
              hint={t("VisitCanadaPost.familyNameHint")}
              value={formData.lastName}
              required
              errorMessage={fieldError("lastName")}
              onGcdsChange={updateField("lastName")}
            />

            <GcdsDateInput
              id={FIELD_IDS.dateOfBirth}
              style={DATE_INPUT_NO_TRAILING_SPACE}
              name={FIELD_IDS.dateOfBirth}
              legend={t("VisitCanadaPost.dobLabel")}
              format="full"
              lang={currentLanguage}
              value={formData.dateOfBirth}
              required
              errorMessage={
                hasSubmitted && errorCodes.dateOfBirth
                  ? dobMessages[errorCodes.dateOfBirth].inline
                  : ""
              }
              onGcdsChange={updateField("dateOfBirth")}
            />

            <GcdsHeading
              tag="h3"
              marginBottom="200"
              style={{ marginBlockStart: "1rem" }}
            >
              {t("VisitCanadaPost.addressHeading")}
            </GcdsHeading>
            <GcdsText marginBottom="500">
              {t("VisitCanadaPost.addressDescription")}
            </GcdsText>

            <GcdsInput
              id={FIELD_IDS.address}
              style={ADDRESS_FIELD_SPACING}
              inputId={FIELD_IDS.address}
              name={FIELD_IDS.address}
              lang={currentLanguage}
              label={t("VisitCanadaPost.addressLabel")}
              hint={t("VisitCanadaPost.addressHint")}
              value={formData.address}
              required
              errorMessage={fieldError("address")}
              onGcdsChange={updateField("address")}
            />

            <GcdsInput
              id={FIELD_IDS.cityTown}
              style={ADDRESS_FIELD_SPACING}
              inputId={FIELD_IDS.cityTown}
              name={FIELD_IDS.cityTown}
              lang={currentLanguage}
              label={t("VisitCanadaPost.cityTownLabel")}
              value={formData.cityTown}
              required
              errorMessage={fieldError("cityTown")}
              onGcdsChange={updateField("cityTown")}
            />

            {showProvince ? (
              variant !== "default" ? (
                provinceSelect
              ) : (
                <GcdsSelect
                  id={FIELD_IDS.province}
                  style={ADDRESS_FIELD_SPACING}
                  selectId={FIELD_IDS.province}
                  name={FIELD_IDS.province}
                  label={t("CanadaPostIdDetails.provinceLabel")}
                  lang={currentLanguage}
                  value={formData.province}
                  defaultValue={t("CanadaPostIdDetails.selectDefaultValue")}
                  required
                  errorMessage={fieldError("province")}
                  onGcdsChange={updateField("province")}
                >
                  {CANADIAN_PROVINCES_AND_TERRITORIES.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.labels[currentLanguage]}
                    </option>
                  ))}
                </GcdsSelect>
              )
            ) : null}

            <GcdsInput
              id={FIELD_IDS.postalCode}
              style={ADDRESS_FIELD_SPACING}
              inputId={FIELD_IDS.postalCode}
              name={FIELD_IDS.postalCode}
              lang={currentLanguage}
              label={t("VisitCanadaPost.postalcodeLabel")}
              hint={t("CanadaPostIdDetails.postalCodeHint")}
              value={formData.postalCode}
              autocomplete="postal-code"
              required
              errorMessage={fieldError("postalCode")}
              onGcdsChange={updateField("postalCode")}
            />
          </GcdsContainer>
        </GcdsGrid>

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
            {t("CanadaPostIdDetails.continueButton")}
          </GcdsButton>
          <GcdsButton
            type="button"
            buttonRole="secondary"
            onGcdsClick={(event: Event) => {
              event.preventDefault();
              navigate(-1);
            }}
          >
            {t("CanadaPostIdDetails.backButton")}
          </GcdsButton>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}
