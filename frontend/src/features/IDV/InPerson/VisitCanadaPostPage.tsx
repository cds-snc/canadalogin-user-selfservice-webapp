import {
  GcdsButton,
  GcdsContainer,
  GcdsDateInput,
  GcdsErrorMessage,
  GcdsErrorSummary,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsNotice,
  GcdsSelect,
  GcdsText,
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
import AcceptableIdsDetails from "../components/AcceptableIdsDetails";
import {
  getVisitCanadaPostValidation,
  MAX_NAME_LENGTH,
  type VisitCanadaPostFormData,
} from "./VisitCanadaPost.validation";
import useGcdsSelectWidth from "../helpers/useGcdsSelectWidth";

const COUNTRY_OPTIONS = [
  { value: "CA", label: "Canada" },
  { value: "US", label: "United States" },
];

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
    givenName: "",
    familyName: "",
    dateOfBirth: "",
    address: "",
    province: "",
    country: "",
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isDateOfBirthTouched, setIsDateOfBirthTouched] = useState(false);
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [summaryFocusTrigger, setSummaryFocusTrigger] = useState(0);

  // GCDS select renders inside shadow DOM, so width styles are applied by a helper hook.
  useGcdsSelectWidth();

  const updateField = (field: keyof VisitCanadaPostFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!showErrorSummary) {
      return;
    }

    const summaryElement = document.getElementById(
      ERROR_SUMMARY_ID,
    ) as HTMLElement | null;

    if (!summaryElement) {
      return;
    }

    // Move user attention to the summary after failed submit to match a11y error UX patterns.
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    summaryElement.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    const firstLink = summaryElement.querySelector(
      "a[href]",
    ) as HTMLElement | null;

    if (firstLink && typeof firstLink.focus === "function") {
      firstLink.focus();
      return;
    }

    summaryElement.setAttribute("tabindex", "-1");
    summaryElement.focus();
  }, [showErrorSummary, summaryFocusTrigger]);

  const createChangeHandler =
    (field: keyof VisitCanadaPostFormData) => (event: CustomEvent) => {
      const target = event.target as
        | HTMLInputElement
        | HTMLSelectElement
        | null;

      updateField(field, target?.value ?? "");
    };

  const { isFormValid, dateOfBirthValidationError, summaryErrorCodes } =
    getVisitCanadaPostValidation(formData);

  const dobMessages = {
    required: {
      inline: t("VisitCanadaPost.dobErrorRequired"),
      summary: t("VisitCanadaPost.summaryDobRequired"),
    },
    year: {
      inline: t("VisitCanadaPost.dobErrorYear"),
      summary: t("VisitCanadaPost.summaryDobYear"),
    },
    future: {
      inline: t("VisitCanadaPost.dobErrorFuture"),
      summary: t("VisitCanadaPost.summaryDobFuture"),
    },
    invalid: {
      inline: t("VisitCanadaPost.dobErrorInvalid"),
      summary: t("VisitCanadaPost.summaryDobInvalid"),
    },
  };

  const dateOfBirthErrorMessage =
    (isDateOfBirthTouched || hasSubmitted) && dateOfBirthValidationError
      ? dobMessages[dateOfBirthValidationError].inline
      : "";

  const dateOfBirthSummaryMessage = dateOfBirthValidationError
    ? dobMessages[dateOfBirthValidationError].summary
    : "";

  const summaryErrors: Record<string, string> = {};

  if (summaryErrorCodes.givenName) {
    summaryErrors["#givenName"] = t("VisitCanadaPost.summaryGivenName");
  }

  if (summaryErrorCodes.familyName) {
    summaryErrors["#familyName"] = t("VisitCanadaPost.summaryFamilyName");
  }

  if (summaryErrorCodes.dateOfBirth) {
    summaryErrors["#dateOfBirth"] = dateOfBirthSummaryMessage;
  }

  if (summaryErrorCodes.address) {
    summaryErrors["#address"] = t("VisitCanadaPost.summaryAddress");
  }

  if (summaryErrorCodes.province) {
    summaryErrors["#province"] = t("VisitCanadaPost.summaryProvince");
  }

  if (summaryErrorCodes.country) {
    summaryErrors["#country"] = t("VisitCanadaPost.summaryCountry");
  }

  const givenNameErrorMessage =
    hasSubmitted && summaryErrorCodes.givenName
      ? t("VisitCanadaPost.summaryGivenName")
      : "";

  const familyNameErrorMessage =
    hasSubmitted && summaryErrorCodes.familyName
      ? t("VisitCanadaPost.summaryFamilyName")
      : "";

  const addressErrorMessage =
    hasSubmitted && summaryErrorCodes.address
      ? t("VisitCanadaPost.summaryAddress")
      : "";

  const provinceErrorMessage =
    hasSubmitted && summaryErrorCodes.province
      ? t("VisitCanadaPost.summaryProvince")
      : "";

  const countryErrorMessage =
    hasSubmitted && summaryErrorCodes.country
      ? t("VisitCanadaPost.summaryCountry")
      : "";

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <form style={{ width: "100%" }}>
        <GcdsGrid columns="1" gap="450">
          <GcdsContainer>
            <GcdsHeading tag="h1">{t("VisitCanadaPost.heading")}</GcdsHeading>

            {showErrorSummary ? (
              <GcdsErrorSummary
                id={ERROR_SUMMARY_ID}
                heading={t("VisitCanadaPost.validationSummaryHeading")}
                errorLinks={summaryErrors}
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
                <li>{t("VisitCanadaPost.step4")}</li>
              </ol>
            </GcdsText>
            <AcceptableIdsDetails
              detailsTitle={t("VisitCanadaPost.listOfIds")}
            />
          </GcdsContainer>

          <GcdsContainer>
            <GcdsHeading tag="h2" marginTop="0">
              {t("VisitCanadaPost.enterInfoHeading")}
            </GcdsHeading>

            <GcdsInput
              id="givenName"
              inputId="givenName"
              name="givenName"
              label={t("VisitCanadaPost.givenNameLabel")}
              hint={t("VisitCanadaPost.givenNameHint")}
              required
              maxlength={MAX_NAME_LENGTH}
              autocomplete="given-name"
              validateOn="blur"
              onGcdsChange={createChangeHandler("givenName")}
            />
            {givenNameErrorMessage ? (
              <GcdsErrorMessage messageId="visit-canada-post-given-name-error">
                {givenNameErrorMessage}
              </GcdsErrorMessage>
            ) : null}

            <GcdsInput
              id="familyName"
              inputId="familyName"
              name="familyName"
              label={t("VisitCanadaPost.familyNameLabel")}
              hint={t("VisitCanadaPost.familyNameHint")}
              required
              maxlength={MAX_NAME_LENGTH}
              autocomplete="family-name"
              validateOn="blur"
              onGcdsChange={createChangeHandler("familyName")}
            />
            {familyNameErrorMessage ? (
              <GcdsErrorMessage messageId="visit-canada-post-family-name-error">
                {familyNameErrorMessage}
              </GcdsErrorMessage>
            ) : null}

            <GcdsDateInput
              id="dateOfBirth"
              name="dateOfBirth"
              legend={t("VisitCanadaPost.dobLabel")}
              required
              format="full"
              validateOn="blur"
              onGcdsChange={createChangeHandler("dateOfBirth")}
              onBlur={() => setIsDateOfBirthTouched(true)}
            />
            {dateOfBirthErrorMessage ? (
              <GcdsErrorMessage messageId="visit-canada-post-dob-error">
                {dateOfBirthErrorMessage}
              </GcdsErrorMessage>
            ) : null}

            <GcdsInput
              id="address"
              inputId="address"
              name="address"
              label={t("VisitCanadaPost.addressLabel")}
              hint={t("VisitCanadaPost.addressHint")}
              required
              autocomplete="street-address"
              validateOn="blur"
              onGcdsChange={createChangeHandler("address")}
            />
            {addressErrorMessage ? (
              <GcdsErrorMessage messageId="visit-canada-post-address-error">
                {addressErrorMessage}
              </GcdsErrorMessage>
            ) : null}

            <GcdsSelect
              id="province"
              className="visit-canada-post-select"
              selectId="province"
              name="province"
              label={t("VisitCanadaPost.provinceLabel")}
              required
              defaultValue=""
              validateOn="blur"
              onGcdsChange={createChangeHandler("province")}
            >
              <option value="">Select option</option>
              {CANADIAN_PROVINCES_AND_TERRITORIES.map((province) => (
                <option key={province.code || "blank"} value={province.code}>
                  {province.labels[currentLanguage]}
                </option>
              ))}
            </GcdsSelect>
            {provinceErrorMessage ? (
              <GcdsErrorMessage messageId="visit-canada-post-province-error">
                {provinceErrorMessage}
              </GcdsErrorMessage>
            ) : null}

            <GcdsSelect
              id="country"
              className="visit-canada-post-select"
              selectId="country"
              name="country"
              label={t("VisitCanadaPost.countryLabel")}
              required
              defaultValue=""
              validateOn="blur"
              onGcdsChange={createChangeHandler("country")}
            >
              <option value="">Select option</option>
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.value || "blank"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </GcdsSelect>
            {countryErrorMessage ? (
              <GcdsErrorMessage messageId="visit-canada-post-country-error">
                {countryErrorMessage}
              </GcdsErrorMessage>
            ) : null}
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

                navigate(
                  path(PAGES.idvProofingBarcodeCanadaPostPage, {
                    language,
                    journeyType,
                  }),
                  {
                    state: {
                      givenName: formData.givenName,
                      lastName: formData.familyName,
                      dateOfBirth: formData.dateOfBirth,
                      address: formData.address,
                      province: formData.province,
                      country: formData.country,
                    },
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
