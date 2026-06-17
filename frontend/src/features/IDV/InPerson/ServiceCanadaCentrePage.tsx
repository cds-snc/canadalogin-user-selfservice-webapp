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
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

export default function ServiceCanadaCentrePage() {
  const navigate = useNavigate();
  const { language } = useParams();

  const { t } = useTranslation("idv");

  const serviceCanadaCodePage = path(PAGES.idvServiceCanadaCentreCodePage, {
    language: language,
  });

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsContainer>
        <GcdsHeading tag="h1">{t("ServiceCanadaCentre.heading")}</GcdsHeading>
      </GcdsContainer>

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

      <GcdsHeading tag="h2" marginBottom="0">
        {t("ServiceCanadaCentre.enterDetailsHeading")}
      </GcdsHeading>

      <form>
        <GcdsSelect
          label={t("ServiceCanadaCentre.selectIdLabel")}
          name="selectId"
          selectId="selectId"
          defaultValue={t("ServiceCanadaCentre.selectIdDropdownDefaultValue")}
          required
        >
          <option value="driverLicence">
            {t("ServiceCanadaCentre.driverLicenceOption")}
          </option>
          <option value="photoIDHealthCard">
            {t("ServiceCanadaCentre.photoIDHealthCardOption")}
          </option>
          <option value="photoIDServiceCard">
            {t("ServiceCanadaCentre.photoIDServiceCardOption")}
          </option>
          <option value="passport">
            {t("ServiceCanadaCentre.passportOption")}
          </option>
          <option value="canadianPRCard">
            {t("ServiceCanadaCentre.canadianPRCardOption")}
          </option>
          <option value="indianStatus">
            {t("ServiceCanadaCentre.indianStatusOption")}
          </option>
        </GcdsSelect>

        <GcdsDateInput
          legend={t("ServiceCanadaCentre.idExpirationLabel")}
          name="id-expiration-date-input"
          format="full"
          required
        />

        <GcdsHeading tag="h2" marginBottom="300">
          {t("ServiceCanadaCentre.enterDetailsIdHeading")}
        </GcdsHeading>

        <GcdsInput
          required
          inputId="first-name-input"
          label={t("ServiceCanadaCentre.firstNameLabel")}
        />
        <GcdsInput
          required
          inputId="last-name-input"
          label={t("ServiceCanadaCentre.lastNameLabel")}
        />

        <GcdsDateInput
          legend={t("ServiceCanadaCentre.dateOfBirthdayLabel")}
          name="date-of-birth-input"
          format="full"
          required
        />

        <GcdsInput
          inputId="address-input"
          label={t("ServiceCanadaCentre.addressLabel")}
          hint={t("ServiceCanadaCentre.addressHint")}
        />

        <GcdsInput
          inputId="province-input"
          label={t("ServiceCanadaCentre.proviceLabel")}
        />
      </form>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          type="button"
          onClick={() => {
            navigate(serviceCanadaCodePage);
          }}
        >
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
    </GcdsContainer>
  );
}
