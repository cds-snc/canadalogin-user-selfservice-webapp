import {
  GcdsButton,
  GcdsContainer,
  GcdsDateInput,
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
import {
  AVAILABLE_LANGUAGES,
  CANADIAN_PROVINCES_AND_TERRITORIES,
  DEV_ONLY_FEATURE,
  PAGES,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import AcceptableIdsDetails from "../components/AcceptableIdsDetails";
import {
  isNonEmptyTrimmed,
  isValidDateOfBirth,
  isValidName,
} from "./VisitCanadaPost.validation";
import useGcdsSelectWidth from "./useGcdsSelectWidth";

const COUNTRY_OPTIONS = [
  { value: "CA", label: "Canada" },
  { value: "US", label: "United States" },
];

interface VisitCanadaPostFormData {
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  address: string;
  province: string;
  country: string;
}

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

  useGcdsSelectWidth();

  const updateField = (field: keyof VisitCanadaPostFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const createChangeHandler = (field: keyof VisitCanadaPostFormData) =>
    (event: CustomEvent) => {
      const target = event.target as
        | HTMLInputElement
        | HTMLSelectElement
        | null;

      updateField(field, target?.value ?? "");
    };

  const isFormValid =
    isValidName(formData.givenName) &&
    isValidName(formData.familyName) &&
    isValidDateOfBirth(formData.dateOfBirth) &&
    isNonEmptyTrimmed(formData.address) &&
    isNonEmptyTrimmed(formData.province) &&
    isNonEmptyTrimmed(formData.country);

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <form style={{ width: "100%" }}>
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
            <AcceptableIdsDetails
              detailsTitle={t("VisitCanadaPost.listOfIds")}
            />
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
              autocomplete="given-name"
              validateOn="blur"
              onGcdsChange={createChangeHandler("givenName")}
            />

            <GcdsInput
              inputId="familyName"
              name="familyName"
              label={t("VisitCanadaPost.familyNameLabel")}
              hint={t("VisitCanadaPost.familyNameHint")}
              required
              autocomplete="family-name"
              validateOn="blur"
              onGcdsChange={createChangeHandler("familyName")}
            />

            <GcdsDateInput
              name="dateOfBirth"
              legend={t("VisitCanadaPost.dobLabel")}
              required
              format="full"
              validateOn="blur"
              onGcdsChange={createChangeHandler("dateOfBirth")}
            />

            <GcdsInput
              inputId="address"
              name="address"
              label={t("VisitCanadaPost.addressLabel")}
              hint={t("VisitCanadaPost.addressHint")}
              required
              autocomplete="street-address"
              validateOn="blur"
              onGcdsChange={createChangeHandler("address")}
            />

            <GcdsSelect
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

            <GcdsSelect
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
          </GcdsContainer>

          <GcdsGrid
            columns="1"
            columnsDesktop="max-content max-content"
            gap="200"
          >
            <GcdsButton
              type="button"
              disabled={!isFormValid}
              onGcdsClick={(event: Event) => {
                event.preventDefault();

                if (!isFormValid) {
                  return;
                }

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
