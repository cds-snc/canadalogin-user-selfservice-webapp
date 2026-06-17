import {
  GcdsButton,
  GcdsContainer,
  GcdsDateInput,
  GcdsDetails,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsNotice,
  GcdsSelect,
  GcdsText,
} from "@gcds-core/components-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DEV_ONLY_FEATURE } from "../../../utils/constants";

const PROVINCE_OPTIONS = [
  { value: "", label: "" },
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

const COUNTRY_OPTIONS = [
  { value: "", label: "" },
  { value: "CA", label: "Canada" },
  { value: "US", label: "United States" },
];

export default function VisitCanadaPost() {
  const { t } = useTranslation("idv");
  const navigate = useNavigate();

  useEffect(() => {
    const applySelectShadowWidth = () => {
      const selects = document.querySelectorAll(
        "gcds-select.visit-canada-post-select",
      );
      selects.forEach((element) => {
        const shadowRoot = element.shadowRoot;

        if (!shadowRoot) {
          return;
        }

        const wrapper = shadowRoot.querySelector(
          ".gcds-select__wrapper",
        ) as HTMLElement | null;

        if (wrapper) {
          wrapper.style.maxWidth = "75ch"; // This follows GC Design System for their wrapper over GcdsInput
        }
        // CSS Classes are not applied to the internal select element, so we need to query and apply styles directly to it
        const internalSelect = shadowRoot.querySelector(
          "select",
        ) as HTMLSelectElement | null;
        if (internalSelect) {
          internalSelect.style.width = "100%"; // Make the internal select take the full width of the wrapper
        }
      });
    };

    applySelectShadowWidth();
  }, []);

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1">{t("VisitCanadaPost.heading")}</GcdsHeading>

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
          <GcdsDetails detailsTitle={t("VisitCanadaPost.listOfIds")}>
            {t("VisitCanadaPost.listOfIds")}
          </GcdsDetails>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("VisitCanadaPost.enterInfoHeading")}
          </GcdsHeading>

          <GcdsInput
            inputId="givenName"
            name="givenName"
            label={t("VisitCanadaPost.givenNameLabel")}
            hint={t("VisitCanadaPost.givenNameHint")}
            required
            validateOn="other"
          />

          <GcdsInput
            inputId="familyName"
            name="familyName"
            label={t("VisitCanadaPost.familyNameLabel")}
            hint={t("VisitCanadaPost.familyNameHint")}
            required
            validateOn="other"
          />

          <GcdsDateInput
            name="dateOfBirth"
            legend={t("VisitCanadaPost.dobLabel")}
            required
            format="full"
            validateOn="other"
          />

          <GcdsInput
            inputId="address"
            name="address"
            label={t("VisitCanadaPost.addressLabel")}
            hint={t("VisitCanadaPost.addressHint")}
            required
            validateOn="other"
          />

          <GcdsSelect
            className="visit-canada-post-select"
            selectId="province"
            name="province"
            label={t("VisitCanadaPost.provinceLabel")}
            required
            defaultValue=""
            validateOn="other"
          >
            {PROVINCE_OPTIONS.map((option) => (
              <option key={option.value || "blank"} value={option.value}>
                {option.label}
              </option>
            ))}
          </GcdsSelect>

          <GcdsSelect
            className="visit-canada-post-select"
            selectId="country"
            name="country"
            label={t("VisitCanadaPost.countryLabel")}
            required
            defaultValue=""
            validateOn="other"
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.value || "blank"} value={option.value}>
                {option.label}
              </option>
            ))}
          </GcdsSelect>
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton type="button">
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
    </GcdsContainer>
  );
}
