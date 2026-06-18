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
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import {
  AVAILABLE_LANGUAGES,
  CANADIAN_PROVINCES_AND_TERRITORIES,
  DEV_ONLY_FEATURE,
  PAGES,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

const IDS_REQUIRING_ADDRESS_AND_PROVINCE = new Set([
  "driverLicence",
  "photoIDHealthCard",
  "photoIDServiceCard",
]);

export default function ServiceCanadaCentrePage() {
  const navigate = useNavigate();
  const { language } = useParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedIdType, setSelectedIdType] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const { t } = useTranslation("idv");

  const serviceCanadaCodePage = path(PAGES.idvServiceCanadaCentreCodePage, {
    language: language,
  });
  const currentLanguage =
    language === AVAILABLE_LANGUAGES.fr
      ? AVAILABLE_LANGUAGES.fr
      : AVAILABLE_LANGUAGES.en;
  const hasSelectedIdType = selectedIdType !== "";

  const showAddressAndProvinceFields =
    IDS_REQUIRING_ADDRESS_AND_PROVINCE.has(selectedIdType);

  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const updateFormValidity = () => {
      setIsFormValid(form.checkValidity());
    };

    updateFormValidity();
    form.addEventListener("input", updateFormValidity);
    form.addEventListener("change", updateFormValidity);
    form.addEventListener("gcdsChange", updateFormValidity as EventListener);

    return () => {
      form.removeEventListener("input", updateFormValidity);
      form.removeEventListener("change", updateFormValidity);
      form.removeEventListener(
        "gcdsChange",
        updateFormValidity as EventListener,
      );
    };
  }, [showAddressAndProvinceFields]);

  const onContinue = () => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    navigate(serviceCanadaCodePage);
  };

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

      <form ref={formRef}>
        <GcdsFieldset
          legend={t("ServiceCanadaCentre.enterDetailsHeading")}
          legendSize="h2"
        >
          {" "}
          <GcdsSelect
            label={t("ServiceCanadaCentre.selectIdLabel")}
            name="selectId"
            selectId="selectId"
            value={selectedIdType}
            defaultValue={t("ServiceCanadaCentre.selectIdDropdownDefaultValue")}
            required
            onGcdsChange={(e: CustomEvent<string>) => {
              const selectedValue = (e.target as HTMLSelectElement).value;
              setSelectedIdType(selectedValue);
            }}
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
        </GcdsFieldset>

        {hasSelectedIdType ? (
          <>
            <GcdsFieldset
              legend={t("ServiceCanadaCentre.enterDetailsHeading")}
              legendSize="h2"
            >
              <GcdsDateInput
                legend={t("ServiceCanadaCentre.idExpirationLabel")}
                name="id-expiration-date-input"
                format="full"
                required
              />
            </GcdsFieldset>

            <GcdsFieldset
              legend={t("ServiceCanadaCentre.enterDetailsIdHeading")}
              legendSize="h2"
            >
              <GcdsInput
                required
                inputId="first-name-input"
                name="first-name-input"
                label={t("ServiceCanadaCentre.firstNameLabel")}
              />
              <GcdsInput
                required
                inputId="last-name-input"
                name="last-name-input"
                label={t("ServiceCanadaCentre.lastNameLabel")}
              />
              <GcdsDateInput
                legend={t("ServiceCanadaCentre.dateOfBirthdayLabel")}
                name="date-of-birth-input"
                format="full"
                required
              />
              {showAddressAndProvinceFields ? (
                <>
                  <GcdsInput
                    inputId="address-input"
                    name="address-input"
                    label={t("ServiceCanadaCentre.addressLabel")}
                    hint={t("ServiceCanadaCentre.addressHint")}
                  />

                  <GcdsSelect
                    name="select-province"
                    selectId="select-province"
                    defaultValue={t(
                      "ServiceCanadaCentre.selectIdDropdownDefaultValue",
                    )}
                    label={t("ServiceCanadaCentre.proviceLabel")}
                  >
                    {CANADIAN_PROVINCES_AND_TERRITORIES.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.labels[currentLanguage]}
                      </option>
                    ))}
                  </GcdsSelect>
                </>
              ) : null}
            </GcdsFieldset>
          </>
        ) : null}
      </form>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton type="button" disabled={!isFormValid} onClick={onContinue}>
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
    </GcdsContainer>
  );
}
