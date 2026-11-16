import {
  GcdsButton,
  GcdsHeading,
  GcdsIcon,
  GcdsLink,
  GcdsText,
  GcdsContainer,
  GcdsGrid,
} from "@gcds-core/components-react";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { useUser } from "../../../components/Providers/useUser";
import { authService } from "../../../services/authService";
import governmentBannerImage from "../../../assets/images/gov-canada-banner.svg";
import {
  APPROVED_DOCUMENT_VALUES,
  type ApprovedDocumentValue,
} from "../data/approvedDocuments";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import "./css/ServiceCanadaCentreIDVCodePage.css";
import "./css/ServiceCanadaCentreIDVCodePage.print.css";

type ServiceCanadaCentreIDVCodePageLocationState = {
  idvCode?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  idType?: string;
  verificationExpiresAt?: string;
  verificationValidityDays?: number;
};

const APPROVED_DOCUMENT_VALUE_SET = new Set<string>(APPROVED_DOCUMENT_VALUES);

const isApprovedDocumentValue = (
  value: string,
): value is ApprovedDocumentValue => APPROVED_DOCUMENT_VALUE_SET.has(value);

const formatCodeWithHyphens = (code: string): string => {
  const normalizedCode = code.replace(/-/g, "").trim();
  return normalizedCode.match(/.{1,3}/g)?.join("-") ?? normalizedCode;
};

export default function ServiceCanadaCentreIDVCodePage() {
  const { state } = useUser();
  const { language, journeyType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("idv");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const serviceCanadaCentrePage = path(PAGES.idvServiceCanadaCentrePage, {
    language,
    journeyType,
  });

  const email = state?.userProfile?.userName ?? "";
  const locationState =
    (location.state as ServiceCanadaCentreIDVCodePageLocationState | null) ??
    null;
  const idvCode = locationState?.idvCode ?? null;
  const formattedIdvCode = idvCode ? formatCodeWithHyphens(idvCode) : null;
  const verificationExpiresAt = locationState?.verificationExpiresAt;
  const verificationValidityDays = locationState?.verificationValidityDays;
  const firstName = locationState?.firstName?.trim() || "--";
  const lastName = locationState?.lastName?.trim() || "--";
  const dateOfBirth = locationState?.dateOfBirth?.trim() || "--";
  const rawIdSelected = locationState?.idType?.trim() || "";
  const idSelectedText = rawIdSelected
    ? isApprovedDocumentValue(rawIdSelected)
      ? t(`ApprovedDocuments.${rawIdSelected}`)
      : rawIdSelected
    : "--";

  const formattedExpiryDate = verificationExpiresAt
    ? new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(verificationExpiresAt))
    : null;

  const codeValidityText = formattedExpiryDate
    ? t("ServiceCanadaCentreCode.codeExpiresOn", {
        expiryDate: formattedExpiryDate,
      })
    : t("ServiceCanadaCentreCode.codeValidDays", {
        validityDays: verificationValidityDays ?? 30,
      });

  const handlePrintPage = () => {
    window.print();
  };

  const handleSignOut = async (event: Event) => {
    event.preventDefault();
    setIsSigningOut(true);

    try {
      const response = await authService.logout();
      if (!response?.data?.redirect_url) {
        window.location.href = "/";
      }
    } catch {
      window.location.href = "/";
    }
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  if (!idvCode) {
    return <Navigate to={serviceCanadaCentrePage} replace />;
  }

  return (
    <GcdsContainer role="main" className="service-canada-idv-code-page">
      <section className="service-canada-code-card">
        <div className="service-canada-code-content">
          <div className="service-canada-print-banner">
            <img
              src={governmentBannerImage}
              alt={t("ServiceCanadaCentreCode.printBannerAlt")}
              className="service-canada-print-banner-image"
            />
          </div>

          <GcdsHeading
            tag="h1"
            marginTop="0"
            className="service-canada-code-title"
          >
            {t("ServiceCanadaCentreCode.heading")}
          </GcdsHeading>

          <section
            className="service-canada-code-notice"
            aria-labelledby="service-canada-code-label"
          >
            <GcdsIcon
              name="info-circle"
              size="h4"
              aria-hidden="true"
              className="service-canada-code-info-icon"
            />
            <GcdsText id="service-canada-code-label" marginBottom="0">
              <strong>{t("ServiceCanadaCentreCode.codeLabel")}</strong>
            </GcdsText>
            <GcdsHeading
              tag="h2"
              marginBottom="0"
              marginTop="0"
              className="service-canada-code-value"
            >
              {formattedIdvCode}
            </GcdsHeading>
            <GcdsText marginBottom="0">
              {formattedExpiryDate ? (
                <>
                  Code expires <strong>{formattedExpiryDate}</strong> and has
                  been emailed to <strong>{email}</strong>.
                </>
              ) : (
                `${codeValidityText} `
              )}
              {!formattedExpiryDate && <strong>{email}</strong>}
              {!formattedExpiryDate && "."}
            </GcdsText>
          </section>

          <section className="service-canada-code-section">
            <GcdsHeading
              tag="h2"
              marginTop="0"
              className="service-canada-code-section-title"
            >
              {t("ServiceCanadaCentreCode.whatToBringHeading")}
            </GcdsHeading>
            <GcdsText marginBottom="0">
              <ul>
                <li>{t("ServiceCanadaCentreCode.whatToBringCode")}</li>
                <li>
                  {t("ServiceCanadaCentreCode.whatToBringId", {
                    idSelected: idSelectedText,
                  })}
                </li>
              </ul>
            </GcdsText>
            <GcdsButton
              buttonRole="primary"
              type="link"
              size="small"
              href="https://offices.service.canada.ca/en"
              target="_blank"
              rel="noreferrer"
              className="service-canada-print-hide"
            >
              {t("ServiceCanadaCentreCode.findCentreButton")}
            </GcdsButton>
          </section>

          <section className="service-canada-code-section">
            <GcdsHeading
              tag="h2"
              marginTop="0"
              className="service-canada-code-section-title"
            >
              {t("ServiceCanadaCentreCode.nextStepsHeading")}
            </GcdsHeading>
            <GcdsText marginBottom="0">
              <ol>
                <li>{t("ServiceCanadaCentreCode.nextStepsFindCentre")}</li>
                <li>{t("ServiceCanadaCentreCode.nextStepsBringCodeAndId")}</li>
                <li>
                  {t("ServiceCanadaCentreCode.nextStepsAfterVerification")}
                </li>
              </ol>
            </GcdsText>
          </section>

          <section className="service-canada-code-section">
            <GcdsHeading
              tag="h2"
              marginTop="0"
              marginBottom="0"
              className="service-canada-code-section-title"
            >
              {t("ServiceCanadaCentreCode.yourInformationHeading")}
            </GcdsHeading>
            <GcdsText marginBottom="0">
              {t("ServiceCanadaCentreCode.checkInformationHint")}
            </GcdsText>

            <GcdsGrid columns="1" gap="150">
              {[
                ["firstName", firstName],
                ["lastName", lastName],
                ["dateOfBirth", dateOfBirth],
                ["idSelected", idSelectedText],
              ].map(([label, value]) => (
                <div className="service-canada-code-detail" key={label}>
                  <GcdsText marginTop="0" marginBottom="0">
                    <strong>{t(`ServiceCanadaCentreCode.${label}`)}</strong>
                  </GcdsText>
                  <GcdsText marginTop="200" marginBottom="0">
                    {value}
                  </GcdsText>
                </div>
              ))}
            </GcdsGrid>

            <div className="service-canada-code-actions service-canada-print-hide">
              <GcdsButton
                buttonRole="secondary"
                size="small"
                type="button"
                className="service-canada-small-button"
                onGcdsClick={(event) => {
                  event.preventDefault();
                  navigate(serviceCanadaCentrePage);
                }}
              >
                {t("ServiceCanadaCentreCode.updateButton")}
              </GcdsButton>
              <GcdsLink
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  handlePrintPage();
                }}
              >
                {t("ServiceCanadaCentreCode.printPageButton")}
              </GcdsLink>
            </div>

            <GcdsButton
              buttonRole="danger"
              size="small"
              type="button"
              disabled={isSigningOut}
              onGcdsClick={handleSignOut}
              className="service-canada-small-button service-canada-print-hide"
            >
              {t("ServiceCanadaCentreCode.signOut")}
            </GcdsButton>
          </section>
        </div>
      </section>
    </GcdsContainer>
  );
}
