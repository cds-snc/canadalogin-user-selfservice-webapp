import {
  GcdsButton,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
  GcdsContainer,
  GcdsSelect,
  GcdsDateInput,
  GcdsErrorSummary,
  GcdsErrorMessage,
  GcdsInput,
  GcdsFieldset,
} from "@gcds-core/components-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import {
  AVAILABLE_LANGUAGES,
  CANADIAN_PROVINCES_AND_TERRITORIES,
  DEV_ONLY_FEATURE,
  PAGES,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { APPROVED_DOCUMENT_VALUES } from "../data/approvedDocuments";
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
import {
  getServiceCanadaCentreValidation,
  type ServiceCanadaCentreFormData,
} from "./validation/ServiceCanadaCentre.validation";
import { focusErrorSummary } from "../helpers/focusErrorSummary";
import { inPersonIdentityVerificationApi } from "../api/inPersonIdentityVerificationApi";

const ERROR_SUMMARY_ID = "service-canada-centre-error-summary";

export default function ServiceCanadaCentrePage() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [summaryFocusTrigger, setSummaryFocusTrigger] = useState(0);
  const [isDateOfBirthTouched, setIsDateOfBirthTouched] = useState(false);
  const [formData, setFormData] = useState<ServiceCanadaCentreFormData>({
    idType: "",
    idExpiryDate: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    address: "",
    province: "",
  });

  const { t } = useTranslation("idv");

  const serviceCanadaCodePage = path(PAGES.idvServiceCanadaCentreCodePage, {
    language: language,
    journeyType: journeyType,
  });
  const currentLanguage =
    language === AVAILABLE_LANGUAGES.fr
      ? AVAILABLE_LANGUAGES.fr
      : AVAILABLE_LANGUAGES.en;

  const updateField = (
    field: keyof ServiceCanadaCentreFormData,
    value: string,
  ) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const createChangeHandler =
    (field: keyof ServiceCanadaCentreFormData) => (event: CustomEvent) => {
      const target = event.target as
        | HTMLInputElement
        | HTMLSelectElement
        | null;

      updateField(field, target?.value ?? "");
    };

  useEffect(() => {
    if (!showErrorSummary) {
      return;
    }

    focusErrorSummary(ERROR_SUMMARY_ID);
  }, [showErrorSummary, summaryFocusTrigger]);

  const {
    isFormValid,
    hasSelectedIdType,
    showAddressAndProvinceFields,
    dateOfBirthValidationError,
    summaryErrorCodes,
  } = getServiceCanadaCentreValidation(formData);
  const dateOfBirthMessages = getSharedDateOfBirthMessages(t);

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
      dateOfBirthMessages[summaryErrorCodes.dateOfBirth].summary;
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

  const dateOfBirthErrorMessage =
    (isDateOfBirthTouched || hasSubmitted) && dateOfBirthValidationError
      ? dateOfBirthMessages[dateOfBirthValidationError].inline
      : "";

  const addressErrorMessage =
    hasSubmitted && summaryErrorCodes.address
      ? getAddressRequiredMessage(t)
      : "";

  const provinceErrorMessage =
    hasSubmitted && summaryErrorCodes.province
      ? getProvinceRequiredMessage(t)
      : "";

  const onContinue = async () => {
    setHasSubmitted(true);

    if (!isFormValid) {
      setShowErrorSummary(true);
      setIsDateOfBirthTouched(true);
      setSummaryFocusTrigger((previous) => previous + 1);
      return;
    }

    setShowErrorSummary(false);

    const response =
      await inPersonIdentityVerificationApi.sendInPersonVerificationCode();

    if (!response?.data?.verificationCode) {
      return;
    }

    navigate(serviceCanadaCodePage, {
      state: { idvCode: response.data.verificationCode },
    });
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <form>
        <GcdsGrid columns="1" gap="200">
          <GcdsHeading tag="h1">{t("ServiceCanadaCentre.heading")}</GcdsHeading>

          {showErrorSummary ? (
            <GcdsErrorSummary
              id={ERROR_SUMMARY_ID}
              heading={getValidationSummaryHeading(t)}
              errorLinks={summaryErrors}
            />
          ) : null}

          <GcdsContainer>
            {" "}
            <GcdsText>
              <strong>{t("ServiceCanadaCentre.followSteps")}</strong>
            </GcdsText>
            <ol>
              <li>
                <GcdsText marginBottom="0">
                  {t("ServiceCanadaCentre.step1")}
                </GcdsText>
              </li>
              <li>
                <GcdsText marginBottom="0">
                  {t("ServiceCanadaCentre.step2")}
                </GcdsText>
              </li>
              <li>
                <GcdsText marginBottom="0">
                  {t("ServiceCanadaCentre.step3")}
                </GcdsText>
              </li>
            </ol>
          </GcdsContainer>

          <GcdsFieldset
            legend={t("ServiceCanadaCentre.enterDetailsHeading")}
            legendSize="h2"
            style={{ overflow: "hidden" }}
          >
            <GcdsSelect
              label={t("ServiceCanadaCentre.selectIdLabel")}
              name="selectId"
              selectId="selectId"
              value={formData.idType}
              required
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
            {idTypeErrorMessage ? (
              <GcdsErrorMessage messageId="service-canada-centre-id-type-error">
                {idTypeErrorMessage}
              </GcdsErrorMessage>
            ) : null}

            {hasSelectedIdType && (
              <GcdsDateInput
                id="id-expiration-date-input"
                legend={t("ServiceCanadaCentre.idExpirationLabel")}
                name="id-expiration-date-input"
                format="full"
                required
                onGcdsChange={createChangeHandler("idExpiryDate")}
              />
            )}
            {idExpiryErrorMessage ? (
              <GcdsErrorMessage messageId="service-canada-centre-id-expiry-error">
                {idExpiryErrorMessage}
              </GcdsErrorMessage>
            ) : null}
          </GcdsFieldset>
          {hasSelectedIdType && (
            <>
              <GcdsFieldset
                legend={t("ServiceCanadaCentre.enterDetailsIdHeading")}
                legendSize="h2"
              >
                <GcdsInput
                  required
                  inputId="first-name-input"
                  name="first-name-input"
                  label={t("ServiceCanadaCentre.firstNameLabel")}
                  errorMessage={firstNameErrorMessage}
                  onGcdsChange={createChangeHandler("firstName")}
                />
                <GcdsInput
                  required
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
                  onGcdsChange={createChangeHandler("dateOfBirth")}
                  onBlur={() => setIsDateOfBirthTouched(true)}
                />
                {dateOfBirthErrorMessage ? (
                  <GcdsErrorMessage messageId="service-canada-centre-date-of-birth-error">
                    {dateOfBirthErrorMessage}
                  </GcdsErrorMessage>
                ) : null}
                {showAddressAndProvinceFields && (
                  <>
                    <GcdsInput
                      required
                      inputId="address-input"
                      name="address-input"
                      label={t("ServiceCanadaCentre.addressLabel")}
                      hint={t("ServiceCanadaCentre.addressHint")}
                      errorMessage={addressErrorMessage}
                      onGcdsChange={createChangeHandler("address")}
                    />

                    <GcdsSelect
                      name="select-province"
                      selectId="select-province"
                      defaultValue={t(
                        "ServiceCanadaCentre.selectIdDropdownDefaultValue",
                      )}
                      label={t("ServiceCanadaCentre.proviceLabel")}
                      required
                      style={{ maxWidth: "100%" }}
                      onGcdsChange={createChangeHandler("province")}
                    >
                      {CANADIAN_PROVINCES_AND_TERRITORIES.map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.labels[currentLanguage]}
                        </option>
                      ))}
                    </GcdsSelect>
                    {provinceErrorMessage ? (
                      <GcdsErrorMessage messageId="service-canada-centre-province-error">
                        {provinceErrorMessage}
                      </GcdsErrorMessage>
                    ) : null}
                  </>
                )}
              </GcdsFieldset>
            </>
          )}

          <GcdsGrid
            columns="1"
            columnsDesktop="max-content max-content"
            gap="200"
          >
            <GcdsButton type="button" onClick={onContinue}>
              {t("ServiceCanadaCentre.continueButton")}
            </GcdsButton>
            <GcdsButton
              type="button"
              buttonRole="secondary"
              onClick={() => {
                navigate(-1);
              }}
            >
              {t("ServiceCanadaCentre.backButton")}
            </GcdsButton>
          </GcdsGrid>

          <GcdsNotice
            noticeRole="info"
            noticeTitleTag="h2"
            noticeTitle={t("ServiceCanadaCentre.moreInfoTitle")}
          >
            {
              //TODO: populate with real URL once available
            }
            <GcdsLink href={"#"} external={true}>
              {t("ServiceCanadaCentre.learnMoreLink")}
            </GcdsLink>
          </GcdsNotice>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}
