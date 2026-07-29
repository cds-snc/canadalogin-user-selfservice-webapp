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
  GcdsInput,
  GcdsFieldset,
} from "@gcds-core/components-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import ErrorSummaryWithFocus from "../../../components/ErrorSummaryWithFocus/ErrorSummaryWithFocus";
import { useUser } from "../../../components/Providers/useUser";
import {
  AVAILABLE_LANGUAGES,
  CANADIAN_PROVINCES_AND_TERRITORIES,
  DEV_ONLY_FEATURE,
  PAGES,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { APPROVED_DOCUMENT_VALUES } from "../data/approvedDocuments";
import {
  getFirstNameRequiredOrInvalidMessage,
  getIdExpiryRequiredMessage,
  getIdTypeRequiredMessage,
  getLastNameRequiredOrInvalidMessage,
  getSharedDateOfBirthMessages,
  getValidationSummaryHeading,
} from "./validation/ErrorsDefinition";
import {
  getServiceCanadaCentreValidation,
  type ServiceCanadaCentreFormData,
} from "./validation/ServiceCanadaCentre.validation";
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
    postalcode: "",
  });

  const { t, i18n } = useTranslation("idv");
  const { state } = useUser();
  const rpInfo = state.relyingPartyInfo;
  const localizedDetail = rpInfo?.localized?.[i18n.language];
  const rpName = localizedDetail?.name ?? rpInfo?.linkName;

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
      state: {
        idvCode: response.data.verificationCode,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        province: formData.province,
        idType: formData.idType,
        idExpiryDate: formData.idExpiryDate,
        verificationExpiresAt: response.data.verificationExpiresAt,
        verificationValidityDays: response.data.verificationValidityDays,
      },
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
            <ErrorSummaryWithFocus
              key={summaryFocusTrigger}
              id={ERROR_SUMMARY_ID}
              errorMessage={getValidationSummaryHeading(t)}
              errorLinks={summaryErrors}
              language={currentLanguage}
            />
          ) : null}

          <GcdsContainer>
            {" "}
            <GcdsText>
              <strong>{t("ServiceCanadaCentre.followSteps")}</strong>
            </GcdsText>
            <GcdsText>
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
                <li>
                  <GcdsText marginBottom="0">
                    {t("ServiceCanadaCentre.step4", {
                      rpName: rpName ?? t("ServiceCanadaCentre.fallbackRpName"),
                    })}
                  </GcdsText>
                </li>
              </ol>
            </GcdsText>
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
              hint={t("ServiceCanadaCentre.idHint")}
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
              <GcdsFieldset
                legend={t("ServiceCanadaCentre.enterDetailsIdHeading")}
                legendSize="h2"
              >
                <GcdsInput
                  required
                  id="first-name-input"
                  inputId="first-name-input"
                  name="first-name-input"
                  label={t("ServiceCanadaCentre.firstNameLabel")}
                  hint={t("ServiceCanadaCentre.firstNameHint")}
                  errorMessage={firstNameErrorMessage}
                  onGcdsChange={createChangeHandler("firstName")}
                />
                <GcdsInput
                  required
                  id="last-name-input"
                  inputId="last-name-input"
                  name="last-name-input"
                  label={t("ServiceCanadaCentre.lastNameLabel")}
                  hint={t("ServiceCanadaCentre.lastNameHint")}
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
                      inputId="address-input"
                      name="address-input"
                      label={t("ServiceCanadaCentre.addressLabel")}
                      hint={t("ServiceCanadaCentre.addressHint")}
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
                      style={{ maxWidth: "100%" }}
                      onGcdsChange={createChangeHandler("province")}
                    >
                      {CANADIAN_PROVINCES_AND_TERRITORIES.map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.labels[currentLanguage]}
                        </option>
                      ))}
                    </GcdsSelect>
                    <GcdsInput
                      inputId="postalcode-input"
                      name="postalcode-input"
                      label={t("ServiceCanadaCentre.postalcodeLabel")}
                      hint={t("ServiceCanadaCentre.postalcodeHint")}
                      onGcdsChange={createChangeHandler("postalcode")}
                    />
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
              {t("ServiceCanadaCentre.chooseDifferentMethodButton")}
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
