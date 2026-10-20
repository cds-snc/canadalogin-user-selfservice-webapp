import {
  GcdsButton,
  GcdsContainer,
  GcdsDateInput,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsSelect,
} from "@gcds-core/components-react";
import { useMemo, useState } from "react";
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
  getLocalizedName,
  isProvinceScopedDocument,
  sortOptionsByLabel,
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
  const issuerIsProvince = selectedDocument
    ? isProvinceScopedDocument(selectedDocument)
    : false;
  // Default form: the API options fill whichever of country/province the
  // document is scoped to, the other one is a static select.
  const showCountry = variant === "default" && issuerIsProvince;
  const showProvince = !issuerIsProvince;

  const [formData, setFormData] = useState<CanadaPostIdDetailsFormData>(() => ({
    idExpiryDate: "",
    documentOptionId:
      selectedDocument?.options.length === 1
        ? String(selectedDocument.options[0].id)
        : "",
    country: showCountry ? CANADA_COUNTRY_CODE : "",
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

  const selectElementIds = useMemo(
    () =>
      [
        FIELD_IDS.documentOptionId,
        showCountry ? FIELD_IDS.country : null,
        showProvince ? FIELD_IDS.province : null,
      ].filter((id): id is string => id !== null),
    [showCountry, showProvince],
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
    { showCountry, showProvince },
  );

  const dobMessages = getSharedDateOfBirthMessages(t);
  const errorMessages: Record<keyof CanadaPostIdDetailsErrorCodes, string> = {
    idExpiryDate:
      errorCodes.idExpiryDate === "too_soon"
        ? getIdExpiryTooSoonMessage(t)
        : errorCodes.idExpiryDate === "invalid"
          ? getIdExpiryInvalidMessage(t)
          : getIdExpiryRequiredMessage(t),
    documentOptionId: issuerIsProvince
      ? getProvinceRequiredMessage(t)
      : getCountryRequiredMessage(t),
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
      .filter((field) => errorCodes[field])
      .map((field) => [`#${FIELD_IDS[field]}`, errorMessages[field]]),
  );

  const updateField =
    (field: keyof CanadaPostIdDetailsFormData) => (event: CustomEvent) => {
      const target = event.target as
        | HTMLInputElement
        | HTMLSelectElement
        | null;
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
        { state: { document: selectedDocument, formData } },
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
            region: formData.province || undefined,
            postalCode: formData.postalCode,
            country: CANADA_COUNTRY_CODE,
          },
          idType: ID_TYPE_BY_DOCUMENT[selectedDocument.key],
          idExpiryDate: formData.idExpiryDate,
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
          idSelected: getLocalizedName(selectedDocument, currentLanguage),
          verificationExpiresAt: response.data.verificationExpiresAt,
          verificationValidityDays: response.data.verificationValidityDays,
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

  const issuerLabel =
    variant === "passport"
      ? t("CanadaPostIdDetails.passportCountryLabel")
      : issuerIsProvince
        ? t("CanadaPostIdDetails.provinceLabel")
        : t("CanadaPostIdDetails.countryLabel");

  const issuerSelect = (
    <GcdsSelect
      id={FIELD_IDS.documentOptionId}
      selectId={FIELD_IDS.documentOptionId}
      name={FIELD_IDS.documentOptionId}
      label={issuerLabel}
      lang={currentLanguage}
      value={formData.documentOptionId}
      defaultValue={t("CanadaPostIdDetails.selectDefaultValue")}
      required
      errorMessage={fieldError("documentOptionId")}
      onGcdsChange={updateField("documentOptionId")}
    >
      {sortOptionsByLabel(selectedDocument.options, currentLanguage).map(
        (option) => (
          <option key={option.id} value={String(option.id)}>
            {getLocalizedName(option, currentLanguage)}
          </option>
        ),
      )}
    </GcdsSelect>
  );

  const countrySelect = (
    <GcdsSelect
      id={FIELD_IDS.country}
      selectId={FIELD_IDS.country}
      name={FIELD_IDS.country}
      label={t("CanadaPostIdDetails.countryLabel")}
      lang={currentLanguage}
      value={formData.country}
      required
      errorMessage={fieldError("country")}
      onGcdsChange={updateField("country")}
    >
      <option value={CANADA_COUNTRY_CODE}>Canada</option>
    </GcdsSelect>
  );

  const provinceSelect = (
    <GcdsSelect
      id={FIELD_IDS.province}
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
            <GcdsHeading tag="h1">{t(headingKey)}</GcdsHeading>

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
            <GcdsDateInput
              id={FIELD_IDS.idExpiryDate}
              name={FIELD_IDS.idExpiryDate}
              legend={t("CanadaPostIdDetails.idExpiryLabel")}
              hint={t("CanadaPostIdDetails.idExpiryHint")}
              format="full"
              lang={currentLanguage}
              value={formData.idExpiryDate}
              required
              errorMessage={fieldError("idExpiryDate")}
              onGcdsChange={updateField("idExpiryDate")}
            />

            {variant === "default" ? (
              issuerIsProvince ? (
                <>
                  {countrySelect}
                  {issuerSelect}
                </>
              ) : (
                <>
                  {issuerSelect}
                  {provinceSelect}
                </>
              )
            ) : (
              issuerSelect
            )}

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

            <GcdsInput
              id={FIELD_IDS.address}
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
              inputId={FIELD_IDS.cityTown}
              name={FIELD_IDS.cityTown}
              lang={currentLanguage}
              label={t("VisitCanadaPost.cityTownLabel")}
              value={formData.cityTown}
              required
              errorMessage={fieldError("cityTown")}
              onGcdsChange={updateField("cityTown")}
            />

            {variant !== "default" && showProvince ? provinceSelect : null}

            <GcdsInput
              id={FIELD_IDS.postalCode}
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
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}
