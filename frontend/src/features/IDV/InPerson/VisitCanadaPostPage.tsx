import {
  GcdsButton,
  GcdsContainer,
  GcdsDateInput,
  GcdsFieldset,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsNotice,
  GcdsSelect,
  GcdsText,
} from "@gcds-core/components-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import ErrorSummaryWithFocus from "../../../components/ErrorSummaryWithFocus/ErrorSummaryWithFocus";
import {
  AVAILABLE_LANGUAGES,
  CANADIAN_PROVINCES_AND_TERRITORIES,
  DEV_ONLY_FEATURE,
  PAGES,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import AcceptableIdsDetails from "../components/AcceptableIdsDetails";
import { APPROVED_DOCUMENT_VALUES } from "../data/approvedDocuments";
import {
  getVisitCanadaPostValidation,
  requiresAddressAndProvince,
  type VisitCanadaPostFormData,
} from "./validation/VisitCanadaPost.validation";
import {
  getAddressRequiredMessage,
  getFirstNameRequiredOrInvalidMessage,
  getIdExpiryRequiredMessage,
  getIdTypeRequiredMessage,
  getLastNameRequiredOrInvalidMessage,
  getProvinceRequiredMessage,
  getSharedDateOfBirthMessages,
  getValidationSummaryHeading,
} from "./validation/ErrorsDefinition";
import useGcdsSelectWidth from "../helpers/useGcdsSelectWidth";

const ERROR_SUMMARY_ID = "visit-canada-post-error-summary";

export default function VisitCanadaPost() {
  const { t } = useTranslation("idv");
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const currentLanguage =
    language === AVAILABLE_LANGUAGES.fr
      ? AVAILABLE_LANGUAGES.fr
      : AVAILABLE_LANGUAGES.en;

  const [formData, setFormData] = useState<VisitCanadaPostFormData>({
    idType: "",
    idExpiryDate: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    address: "",
    province: "",
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isDateOfBirthTouched, setIsDateOfBirthTouched] = useState(false);
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [summaryFocusTrigger, setSummaryFocusTrigger] = useState(0);

  const updateField = (field: keyof VisitCanadaPostFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const createChangeHandler =
    (field: keyof VisitCanadaPostFormData) => (event: CustomEvent) => {
      const target = event.target as
        | HTMLInputElement
        | HTMLSelectElement
        | null;

      updateField(field, target?.value ?? "");
    };

  const {
    isFormValid,
    hasSelectedIdType,
    showAddressAndProvinceFields,
    dateOfBirthValidationError,
    summaryErrorCodes,
  } = getVisitCanadaPostValidation(formData);

  const selectElementIds = showAddressAndProvinceFields
    ? ["selectId", "select-province"]
    : ["selectId"];

  useGcdsSelectWidth(selectElementIds);

  const dobMessages = getSharedDateOfBirthMessages(t);

  const dateOfBirthErrorMessage =
    (isDateOfBirthTouched || hasSubmitted) && dateOfBirthValidationError
      ? dobMessages[dateOfBirthValidationError].inline
      : "";

  const summaryErrors: Record<string, string> = {};

  if (summaryErrorCodes.idType) {
    summaryErrors["#selectId"] = getIdTypeRequiredMessage(t);
  }

  if (summaryErrorCodes.idExpiryDate) {
    summaryErrors["#id-expiration-date-input"] = getIdExpiryRequiredMessage(t);
  }

  if (summaryErrorCodes.firstName) {
    summaryErrors["#first-name-input"] =
      getFirstNameRequiredOrInvalidMessage(t);
  }

  if (summaryErrorCodes.lastName) {
    summaryErrors["#last-name-input"] = getLastNameRequiredOrInvalidMessage(t);
  }

  if (summaryErrorCodes.dateOfBirth) {
    summaryErrors["#date-of-birth-input"] =
      dobMessages[summaryErrorCodes.dateOfBirth].summary;
  }

  if (summaryErrorCodes.address) {
    summaryErrors["#address-input"] = getAddressRequiredMessage(t);
  }

  if (summaryErrorCodes.province) {
    summaryErrors["#select-province"] = getProvinceRequiredMessage(t);
  }

  const idTypeErrorMessage =
    hasSubmitted && summaryErrorCodes.idType ? getIdTypeRequiredMessage(t) : "";

  const idExpiryErrorMessage =
    hasSubmitted && summaryErrorCodes.idExpiryDate
      ? getIdExpiryRequiredMessage(t)
      : "";

  const firstNameErrorMessage =
    hasSubmitted && summaryErrorCodes.firstName
      ? getFirstNameRequiredOrInvalidMessage(t)
      : "";

  const lastNameErrorMessage =
    hasSubmitted && summaryErrorCodes.lastName
      ? getLastNameRequiredOrInvalidMessage(t)
      : "";

  const addressErrorMessage =
    hasSubmitted && summaryErrorCodes.address
      ? getAddressRequiredMessage(t)
      : "";

  const provinceErrorMessage =
    hasSubmitted && summaryErrorCodes.province
      ? getProvinceRequiredMessage(t)
      : "";

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <form>
        <GcdsGrid columns="1" gap="450">
          <GcdsContainer>
            <GcdsHeading tag="h1">{t("VisitCanadaPost.heading")}</GcdsHeading>

            {showErrorSummary ? (
              <ErrorSummaryWithFocus
                key={summaryFocusTrigger}
                id={ERROR_SUMMARY_ID}
                errorMessage={getValidationSummaryHeading(t)}
                errorLinks={summaryErrors}
                language={currentLanguage}
              />
            ) : null}

            <GcdsText>
              <strong>{t("VisitCanadaPost.followSteps")}</strong>
            </GcdsText>

            <GcdsText>
              <ol>
                <li>{t("VisitCanadaPost.step1")}</li>
                <li>{t("VisitCanadaPost.step2")}</li>
                <li>{t("VisitCanadaPost.step3")}</li>
              </ol>
            </GcdsText>
            <AcceptableIdsDetails
              detailsTitle={t("VisitCanadaPost.listOfIds")}
            />
          </GcdsContainer>

          <GcdsContainer>
            <GcdsFieldset
              legend={t("ServiceCanadaCentre.enterDetailsHeading")}
              legendSize="h2"
            >
              <GcdsSelect
                id="selectId"
                label={t("ServiceCanadaCentre.selectIdLabel")}
                name="selectId"
                selectId="selectId"
                value={formData.idType}
                required
                errorMessage={idTypeErrorMessage}
                onGcdsChange={createChangeHandler("idType")}
                defaultValue={t(
                  "ServiceCanadaCentre.selectIdDropdownDefaultValue",
                )}
              >
                {APPROVED_DOCUMENT_VALUES.map((docValue) => (
                  <option key={docValue} value={docValue}>
                    {t(`ApprovedDocuments.${docValue}`)}
                  </option>
                ))}
              </GcdsSelect>

              {hasSelectedIdType && (
                <GcdsDateInput
                  id="id-expiration-date-input"
                  legend={t("ServiceCanadaCentre.idExpirationLabel")}
                  name="id-expiration-date-input"
                  format="full"
                  required
                  errorMessage={idExpiryErrorMessage}
                  onGcdsChange={createChangeHandler("idExpiryDate")}
                />
              )}
            </GcdsFieldset>

            {hasSelectedIdType && (
              <>
                <GcdsInput
                  required
                  id="first-name-input"
                  inputId="first-name-input"
                  name="first-name-input"
                  label={t("ServiceCanadaCentre.firstNameLabel")}
                  errorMessage={firstNameErrorMessage}
                  onGcdsChange={createChangeHandler("firstName")}
                />

                <GcdsInput
                  required
                  id="last-name-input"
                  inputId="last-name-input"
                  name="last-name-input"
                  label={t("ServiceCanadaCentre.lastNameLabel")}
                  errorMessage={lastNameErrorMessage}
                  onGcdsChange={createChangeHandler("lastName")}
                />

                <GcdsDateInput
                  id="date-of-birth-input"
                  legend={t("ServiceCanadaCentre.dateOfBirthdayLabel")}
                  name="date-of-birth-input"
                  format="full"
                  required
                  errorMessage={dateOfBirthErrorMessage}
                  onGcdsChange={createChangeHandler("dateOfBirth")}
                  onBlur={() => setIsDateOfBirthTouched(true)}
                />

                {showAddressAndProvinceFields && (
                  <>
                    <GcdsInput
                      required
                      id="address-input"
                      inputId="address-input"
                      name="address-input"
                      label={t("ServiceCanadaCentre.addressLabel")}
                      hint={t("ServiceCanadaCentre.addressHint")}
                      errorMessage={addressErrorMessage}
                      onGcdsChange={createChangeHandler("address")}
                    />

                    <GcdsSelect
                      id="select-province"
                      name="select-province"
                      selectId="select-province"
                      defaultValue={t(
                        "ServiceCanadaCentre.selectIdDropdownDefaultValue",
                      )}
                      label={t("ServiceCanadaCentre.provinceLabel")}
                      required
                      errorMessage={provinceErrorMessage}
                      onGcdsChange={createChangeHandler("province")}
                    >
                      {CANADIAN_PROVINCES_AND_TERRITORIES.map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.labels[currentLanguage]}
                        </option>
                      ))}
                    </GcdsSelect>
                  </>
                )}
              </>
            )}
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
                setHasSubmitted(true);

                if (!isFormValid) {
                  setShowErrorSummary(true);
                  setIsDateOfBirthTouched(true);
                  // Re-trigger focus/scroll if user submits invalid data multiple times.
                  setSummaryFocusTrigger((previous) => previous + 1);
                  return;
                }

                setShowErrorSummary(false);

                const navigationState = {
                  givenName: formData.firstName,
                  lastName: formData.lastName,
                  dateOfBirth: formData.dateOfBirth,
                  idSelected: formData.idType,
                  ...(requiresAddressAndProvince(formData.idType)
                    ? { address: formData.address }
                    : {}),
                };

                navigate(
                  path(PAGES.idvProofingBarcodeCanadaPostPage, {
                    language,
                    journeyType,
                  }),
                  {
                    state: navigationState,
                  },
                );
              }}
            >
              {t("VisitCanadaPost.continueButton")}
            </GcdsButton>
            <GcdsButton
              type="button"
              buttonRole="secondary"
              onGcdsClick={(event: Event) => {
                event.preventDefault();
                navigate(-1);
              }}
            >
              {t("VisitCanadaPost.differentMethodButton")}
            </GcdsButton>
          </GcdsGrid>

          <GcdsNotice
            noticeRole="info"
            noticeTitleTag="h2"
            noticeTitle={t("VisitCanadaPost.moreInfoTitle")}
          >
            <GcdsLink href="#" external={true}>
              {t("VisitCanadaPost.learnMoreLink")}
            </GcdsLink>
          </GcdsNotice>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}
