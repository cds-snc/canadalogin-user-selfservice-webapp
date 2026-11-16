import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsRadios,
  GcdsText,
} from "@gcds-core/components-react";

import AccessibleNotice from "../../../components/InfoBlocks/AccessibleNotice";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import ErrorSummaryWithFocus from "../../../components/ErrorSummaryWithFocus/ErrorSummaryWithFocus";
import {
  AVAILABLE_LANGUAGES,
  DEV_ONLY_FEATURE,
  PAGES,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { useRelyingPartyInfo } from "../../../hooks/useRelyingPartyInfo";
import {
  getFirstNameRequiredOrInvalidMessage,
  APPROVED_DOCUMENT_VALUES_WITHOUT_NO_IDS,
  type ApprovedDocumentValue,
} from "../data/approvedDocuments";
import {
  getIdTypeRequiredMessage,
  getValidationSummaryHeading,
} from "./validation/ErrorsDefinition";

const ERROR_SUMMARY_ID = "service-canada-centre-error-summary";
const NON_EXPIRED_ID_RADIOS_ID = "non-expired-id-radios";
const ID_RADIOS_ID = "select-id-radios";

export default function ServiceCanadaCentrePage() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const [selectedIdType, setSelectedIdType] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [summaryFocusTrigger, setSummaryFocusTrigger] = useState(0);
  const [nonExpiredIdAnswer, setNonExpiredIdAnswer] = useState("");
  const { t } = useTranslation("idv");
  const { relyingPartyName: rpName } = useRelyingPartyInfo();

  const completeIdentityProofingPage = path(
    PAGES.idvCompleteIdentityProofingPage,
    {
      language: language,
      journeyType: journeyType,
    },
  );

  const serviceCanadaDetailsPage = path(
    PAGES.idvServiceCanadaCentreIdDetailsPage,
    { language, journeyType },
  );
  const currentLanguage =
    language === AVAILABLE_LANGUAGES.fr
      ? AVAILABLE_LANGUAGES.fr
      : AVAILABLE_LANGUAGES.en;

  const idOptions = [
    ...APPROVED_DOCUMENT_VALUES_WITHOUT_NO_IDS.map((idType) => ({
      id: `radio-${idType}`,
      value: idType,
      label: t(`ApprovedDocuments.${idType}`),
      checked: selectedIdType === idType,
    })),
    {
      id: "radio-no-ids",
      value: "noIds",
      label: t("ServiceCanadaCentre.noIds"),
      checked: selectedIdType === "noIds",
    },
  ];
  const nonExpiredIdRadioOptions = [
    {
      id: "radio-non-expired-id-yes",
      value: "yes",
      label: t("ServiceCanadaCentre.yesOption"),
      checked: nonExpiredIdAnswer === "yes",
    },
    {
      id: "radio-non-expired-id-no",
      value: "no",
      label: t("ServiceCanadaCentre.noOption"),
      checked: nonExpiredIdAnswer === "no",
    },
  ];
  const nonExpiredIdError =
    hasSubmitted && !nonExpiredIdAnswer
      ? t("ErrorsDefinition.selectOptionRequired")
      : "";
  const idTypeError =
    hasSubmitted && nonExpiredIdAnswer === "yes" && !selectedIdType
      ? getIdTypeRequiredMessage(t)
      : "";

  const onNonExpiredIdChange = (event: CustomEvent<string>) => {
    setNonExpiredIdAnswer(
      (event.target as HTMLInputElement | null)?.value ?? "",
    );
  };

  const createChangeHandler =
    (field: keyof ServiceCanadaCentreFormData) => (event: CustomEvent) => {
      const target = event.target as
        HTMLInputElement | HTMLSelectElement | null;

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
  const onContinue = () => {
    setHasSubmitted(true);

    if (!nonExpiredIdAnswer) {
      setSummaryFocusTrigger((previous) => previous + 1);
      return;
    }

    if (nonExpiredIdAnswer === "no") {
      navigate(completeIdentityProofingPage);
      return;
    }

    if (!selectedIdType) {
      setSummaryFocusTrigger((previous) => previous + 1);
      return;
    }

    if (selectedIdType === "noIds") {
      navigate(
        path(PAGES.idvProveIdentityInPersonPage, { language, journeyType }),
      );
      return;
    }

    navigate(serviceCanadaDetailsPage, {
      state: { idType: selectedIdType as ApprovedDocumentValue },
    });
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <form>
        <GcdsGrid columns="1" gap="450">
          <GcdsHeading tag="h1">{t("ServiceCanadaCentre.heading")}</GcdsHeading>

          {nonExpiredIdError || idTypeError ? (
            <ErrorSummaryWithFocus
              key={summaryFocusTrigger}
              id={ERROR_SUMMARY_ID}
              errorMessage={getValidationSummaryHeading(t)}
              errorLinks={Object.fromEntries(
                [
                  nonExpiredIdError
                    ? [`#${NON_EXPIRED_ID_RADIOS_ID}`, nonExpiredIdError]
                    : null,
                  idTypeError ? [`#${ID_RADIOS_ID}`, idTypeError] : null,
                ].filter((entry): entry is [string, string] => entry !== null),
              )}
              language={currentLanguage}
            />
          ) : null}

          <GcdsContainer>
            <GcdsText>
              <strong>{t("ServiceCanadaCentre.followSteps")}</strong>
            </GcdsText>
            <GcdsText>
              <ol>
                <li>{t("ServiceCanadaCentre.step1")}</li>
                <li>{t("ServiceCanadaCentre.step2")}</li>
                <li>{t("ServiceCanadaCentre.step3")}</li>
                <li>{t("ServiceCanadaCentre.step4", { rpName })}</li>
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
              style={{ marginTop: "24px" }}
              lang={currentLanguage}
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
              <>
                <GcdsInput
                  required
                  id="first-name-input"
                  inputId="first-name-input"
                  name="first-name-input"
                  lang={currentLanguage}
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
                  lang={currentLanguage}
                  label={t("ServiceCanadaCentre.lastNameLabel")}
                  hint={t("ServiceCanadaCentre.lastNameHint")}
                  errorMessage={lastNameErrorMessage}
                  onGcdsChange={createChangeHandler("lastName")}
                />
                <GcdsDateInput
                  id="date-of-birth-input"
                  legend={t("ServiceCanadaCentre.dateOfBirthdayLabel")}
                  name="date-of-birth-input"
                  lang={currentLanguage}
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
                    <GcdsInput
                      inputId="city-town-input"
                      name="city-town-input"
                      label={t("ServiceCanadaCentre.cityTownLabel")}
                      onGcdsChange={createChangeHandler("cityTown")}
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
                      onGcdsChange={createChangeHandler("postalcode")}
                    />
                  </>
                )}
              </>
            )}
          </GcdsFieldset>
          <GcdsRadios
            id={ID_RADIOS_ID}
            name="select-id"
            legend={t("ServiceCanadaCentre.selectIdLabel")}
            hint={t("ServiceCanadaCentre.idHint")}
            lang={currentLanguage}
            options={idOptions}
            value={selectedIdType}
            required
            errorMessage={idTypeError}
            onGcdsChange={(event: CustomEvent<string>) => {
              setSelectedIdType(
                (event.target as HTMLInputElement | null)?.value ?? "",
              );
            }}
          />

          <GcdsRadios
            id={NON_EXPIRED_ID_RADIOS_ID}
            name="non-expired-id-radios"
            legend={t("ServiceCanadaCentre.nonExpiredIdTitle")}
            hint={t("ServiceCanadaCentre.nonExpiredIdHint")}
            options={nonExpiredIdRadioOptions}
            required
            errorMessage={nonExpiredIdError}
            onGcdsChange={onNonExpiredIdChange}
          />

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

          <AccessibleNotice
            noticeRole="info"
            noticeTitleTag="h2"
            noticeTitle={t("ServiceCanadaCentre.moreInfoTitle")}
          >
            {
              //TODO: populate with real URL once available
            }
            <GcdsLink
              href={"#"}
              external={true}
              style={{ textDecoration: "underline" }}
            >
              {t("ServiceCanadaCentre.learnMoreLink")}
            </GcdsLink>
          </AccessibleNotice>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}
