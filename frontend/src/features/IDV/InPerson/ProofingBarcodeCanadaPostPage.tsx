import {
  GcdsButton,
  GcdsContainer,
  GcdsHeading,
  GcdsLink,
  GcdsText,
  GcdsIcon,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";
import BarcodeDisplay from "../helpers/BarcodeDisplay";
import { useUser } from "../../../components/Providers/useUser";
import { authService } from "../../../services/authService";
import governmentBannerImage from "../../../assets/images/gov-canada-banner.svg";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import AcceptableProofOfAddressDocuments from "../components/AcceptableProofOfAddressDocuments";
import { formatDateOfBirthForDisplay } from "./validation/InPersonIdentity.validation";
import {
  APPROVED_DOCUMENT_VALUES,
  type ApprovedDocumentValue,
} from "../data/approvedDocuments";
import "./css/ProofingBarcodeCanadaPostPage.css";
import "./css/ProofingBarcodeCanadaPostPage.print.css";
import { useState } from "react";

type ProofingBarcodeCanadaPostState = {
  idvCode?: string;
  email?: string;
  givenName?: string;
  lastName?: string;
  dateOfBirth?: string;
  idSelected?: string;
  verificationExpiresAt?: string;
  verificationValidityDays?: number;
  proofOfAddressRequired?: boolean;
};

const APPROVED_DOCUMENT_VALUE_SET = new Set<string>(APPROVED_DOCUMENT_VALUES);

const isApprovedDocumentValue = (
  value: string,
): value is ApprovedDocumentValue => APPROVED_DOCUMENT_VALUE_SET.has(value);

export default function ProofingBarcodeCanadaPostPage() {
  const { t } = useTranslation("idv");
  const { language, journeyType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const locationState =
    (location.state as ProofingBarcodeCanadaPostState | null) ?? null;

  const barcodeValue = locationState?.idvCode ?? "CP387DHROGJ";

  const visitCanadaPostPage = path(PAGES.idvVisitCanadaPostPage, {
    language,
    journeyType,
  });

  const email = state?.userProfile?.userName ?? "";
  const givenName = locationState?.givenName?.trim() || "--";
  const lastName = locationState?.lastName?.trim() || "--";
  const dateOfBirth = formatDateOfBirthForDisplay(
    locationState?.dateOfBirth?.trim() || "--",
  );
  const verificationExpiresAt = locationState?.verificationExpiresAt;
  const verificationValidityDays = locationState?.verificationValidityDays;
  const proofOfAddressRequired = locationState?.proofOfAddressRequired === true;
  const rawIdSelected = locationState?.idSelected?.trim() || "";
  const idSelected = rawIdSelected
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
    ? t("ProofingBarcodeCanadaPost.codeValidDaysDynamic", {
        expiryDate: formattedExpiryDate,
        validityDays: verificationValidityDays ?? 30,
      })
    : t("ProofingBarcodeCanadaPost.codeValidDays", {
        validityDays: verificationValidityDays ?? 30,
      });

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

  const handlePrintPage = () => {
    window.print();
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main" className="canada-post-idv-code-page">
      <section className="canada-post-code-card">
        <div className="canada-post-code-content">
          <div className="canada-post-print-banner">
            <img
              src={governmentBannerImage}
              alt={t("ProofingBarcodeCanadaPost.printBannerAlt")}
              className="visit-canada-post-print-banner-image"
            />
          </div>

          <GcdsHeading tag="h1" marginBottom="0">
            {t("ProofingBarcodeCanadaPost.heading")}
          </GcdsHeading>

          <BarcodeDisplay
            value={barcodeValue}
            ariaLabel={t("ProofingBarcodeCanadaPost.barcodeAriaLabel", {
              code: barcodeValue,
            })}
            height={120}
            maxWidth="22.5rem"
            widthScale={0.7}
          />

          <section
            className="canada-post-code-notice canada-post-code-notice-bg"
            aria-labelledby="canada-post-code-label"
          >
            <GcdsIcon
              name="info-circle"
              size="h4"
              aria-hidden="true"
              className="canada-post-code-info-icon"
            />
            <GcdsText id="canada-post-code-label" marginBottom="0">
              <strong>{t("ProofingBarcodeCanadaPost.codeLabel")}</strong>
            </GcdsText>
            <GcdsText>
              {codeValidityText} <strong>{email}</strong>
            </GcdsText>
          </section>

          <section className="canada-post-code-section">
            <GcdsHeading
              marginTop="0"
              marginBottom="0"
              tag="h2"
              className="canada-post-code-section-title"
            >
              {t("ProofingBarcodeCanadaPost.whatToBringHeading")}
            </GcdsHeading>
            <GcdsText>
              <ul>
                <li>{t("ProofingBarcodeCanadaPost.whatToBringCode")}</li>
                <li>
                  {t("ProofingBarcodeCanadaPost.whatToBringId", {
                    idSelected: idSelected,
                  })}
                </li>
                {proofOfAddressRequired && (
                  <li>
                    {t("ProofingBarcodeCanadaPost.whatToBringProofOfAddress")}
                  </li>
                )}
              </ul>
            </GcdsText>

            {proofOfAddressRequired && (
              <div>
                <section
                  className="canada-post-code-notice canada-post-warning-notice-bg"
                  aria-labelledby="canada-post-code-label"
                >
                  <GcdsIcon
                    name="warning-triangle"
                    size="h4"
                    aria-hidden="true"
                    className="canada-post-warning-icon"
                  />
                  <GcdsText id="canada-post-code-label" marginBottom="0">
                    <strong>
                      {t("ProofingBarcodeCanadaPost.whatToBringAddress")}
                    </strong>
                  </GcdsText>
                  <GcdsText>
                    {t("ProofingBarcodeCanadaPost.whatToBringHint")}
                  </GcdsText>
                </section>
                <div style={{ marginTop: "1rem" }} />

                <AcceptableProofOfAddressDocuments
                  detailsTitle={t(
                    "ProofingBarcodeCanadaPost.listOfProofOfAddressDocuments",
                  )}
                />
                <div style={{ marginBottom: "1rem" }} />
              </div>
            )}

            <GcdsButton
              buttonRole="primary"
              type="link"
              size="small"
              href={t("ProofingBarcodeCanadaPost.findNearestPostOfficeLink")}
              target="_blank"
              rel="noreferrer"
              className="canada-post-print-hide"
            >
              {t("ProofingBarcodeCanadaPost.findNearestTitle")}
            </GcdsButton>
          </section>

          <section className="canada-post-code-section">
            <GcdsHeading
              tag="h2"
              marginTop="0"
              marginBottom="0"
              className="canada-post-code-section-title"
            >
              {t("ProofingBarcodeCanadaPost.yourInformationHeading")}
            </GcdsHeading>
            <GcdsText>
              {t("ProofingBarcodeCanadaPost.yourInformationHint")}
            </GcdsText>

            <div>
              <GcdsText marginBottom="0">
                <strong>{t("ProofingBarcodeCanadaPost.givenName")}</strong>
              </GcdsText>
              <GcdsText marginTop="200" marginBottom="0">
                {givenName}
              </GcdsText>
            </div>

            <div>
              <GcdsText marginTop="0" marginBottom="0">
                <strong>{t("ProofingBarcodeCanadaPost.lastName")}</strong>
              </GcdsText>
              <GcdsText marginTop="200" marginBottom="0">
                {lastName}
              </GcdsText>
            </div>

            <div className="separator" style={{ margin: "0" }} />

            <div>
              <GcdsText marginTop="0" marginBottom="0">
                <strong>{t("ProofingBarcodeCanadaPost.dateOfBirth")}</strong>
              </GcdsText>
              <GcdsText marginTop="200" marginBottom="0">
                {dateOfBirth}
              </GcdsText>
            </div>

            <div className="separator" style={{ margin: "0" }} />

            <div>
              <GcdsText marginTop="0" marginBottom="0">
                <strong>{t("ProofingBarcodeCanadaPost.idSelected")}</strong>
              </GcdsText>
              <GcdsText marginTop="200" marginBottom="0">
                {idSelected}
              </GcdsText>
            </div>

            <div className="separator" style={{ margin: "0" }} />

            <div className="canada-post-code-actions canada-post-print-hide">
              <GcdsButton
                buttonRole="secondary"
                type="button"
                onGcdsClick={(event) => {
                  event.preventDefault();
                  navigate(visitCanadaPostPage);
                }}
              >
                {t("ProofingBarcodeCanadaPost.update")}
              </GcdsButton>

              <GcdsLink
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  handlePrintPage();
                }}
              >
                {t("ProofingBarcodeCanadaPost.printPageButton")}
              </GcdsLink>
            </div>

            <GcdsButton
              buttonRole="danger"
              size="small"
              type="button"
              disabled={isSigningOut}
              onGcdsClick={handleSignOut}
              className="canada-post-small-button canada-post-print-hide"
            >
              {t("ProofingBarcodeCanadaPost.signOut")}
            </GcdsButton>
          </section>
        </div>
      </section>
    </GcdsContainer>
  );
}
