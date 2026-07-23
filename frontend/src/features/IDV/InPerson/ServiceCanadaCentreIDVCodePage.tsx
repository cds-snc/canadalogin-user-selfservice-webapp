import {
  GcdsButton,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
  GcdsContainer,
  GcdsGrid,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { useUser } from "../../../components/Providers/useUser";
import governmentBannerImage from "../../../assets/images/gov-canada-banner.svg";
import {
  APPROVED_DOCUMENT_VALUES,
  type ApprovedDocumentValue,
} from "../data/approvedDocuments";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

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

  const serviceCanadaCentrePage = path(PAGES.idvServiceCanadaCentrePage, {
    language,
    journeyType,
  });

  const email = state?.userProfile?.userName ?? "";
  const locationState =
    (location.state as ServiceCanadaCentreIDVCodePageLocationState | null) ??
    null;
  const idvCode = locationState?.idvCode ?? null;
  const verificationExpiresAt = locationState?.verificationExpiresAt;
  const verificationValidityDays = locationState?.verificationValidityDays;
  const firstName = locationState?.firstName?.trim() || "--";
  const lastName = locationState?.lastName?.trim() || "--";
  const dateOfBirth = (() => {
    const trimmedDate = locationState?.dateOfBirth?.trim();

    if (!trimmedDate) {
      return "--";
    }

    const isoDateMatch = trimmedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch;
      const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(parsedDate);
    }

    const parsedDate = new Date(trimmedDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return trimmedDate;
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(parsedDate);
  })();
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
    ? t("ServiceCanadaCentreCode.codeValidDaysDynamic", {
        expiryDate: formattedExpiryDate,
        validityDays: verificationValidityDays ?? 30,
      })
    : t("ServiceCanadaCentreCode.codeValidDays", {
        validityDays: verificationValidityDays ?? 30,
      });

  const handlePrintPage = () => {
    window.print();
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  if (!idvCode) {
    return <Navigate to={serviceCanadaCentrePage} replace />;
  }

  return (
    <GcdsContainer role="main" className="service-canada-idv-code-page">
      <GcdsGrid columns="1" gap="450">
        <div className="service-canada-print-banner">
          <img
            src={governmentBannerImage}
            alt={t("ServiceCanadaCentreCode.printBannerAlt")}
            className="service-canada-print-banner-image"
          />
        </div>

        <GcdsHeading tag="h1" marginTop="0">
          {t("ServiceCanadaCentreCode.heading")}
        </GcdsHeading>

        <GcdsHeading tag="h2" marginBottom="0" marginTop="0">
          <strong>{formattedIdvCode}</strong>
        </GcdsHeading>
        <GcdsContainer>
          <GcdsText>
            {codeValidityText} <strong>{email}</strong>.
          </GcdsText>
          <GcdsText marginBottom="0">
            {t("ServiceCanadaCentreCode.visitInstruction", {
              idSelected: idSelectedText,
            })}
          </GcdsText>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ServiceCanadaCentreCode.yourInformationHeading")}
          </GcdsHeading>

          <GcdsContainer>
            <GcdsGrid columns="1" gap="150">
              <div>
                <GcdsText marginTop="0" marginBottom="0">
                  <strong>{t("ServiceCanadaCentreCode.firstName")}</strong>
                </GcdsText>
                <GcdsText marginTop="200" marginBottom="0">
                  {firstName}
                </GcdsText>
              </div>

              <div className="separator" style={{ margin: "0" }} />

              <div>
                <GcdsText marginTop="0" marginBottom="0">
                  <strong>{t("ServiceCanadaCentreCode.lastName")}</strong>
                </GcdsText>
                <GcdsText marginTop="200" marginBottom="0">
                  {lastName}
                </GcdsText>
              </div>

              <div className="separator" style={{ margin: "0" }} />

              <div>
                <GcdsText marginTop="0" marginBottom="0">
                  <strong>{t("ServiceCanadaCentreCode.dateOfBirth")}</strong>
                </GcdsText>
                <GcdsText marginTop="200" marginBottom="0">
                  {dateOfBirth}
                </GcdsText>
              </div>

              <div className="separator" style={{ margin: "0" }} />

              <div>
                <GcdsText marginTop="0" marginBottom="0">
                  <strong>{t("ServiceCanadaCentreCode.idSelected")}</strong>
                </GcdsText>
                <GcdsText marginTop="200" marginBottom="0">
                  {idSelectedText}
                </GcdsText>
              </div>

              <div className="separator" style={{ margin: "0" }} />

              <div
                className="service-canada-print-hide"
                style={{ marginTop: "1.5rem" }}
              >
                <GcdsGrid
                  columns="1"
                  columnsDesktop="max-content max-content"
                  gap="200"
                >
                  <GcdsButton
                    buttonRole="primary"
                    type="button"
                    onGcdsClick={handlePrintPage}
                  >
                    {t("ServiceCanadaCentreCode.printPageButton")}
                  </GcdsButton>
                  <GcdsButton
                    buttonRole="secondary"
                    type="button"
                    onGcdsClick={(event) => {
                      event.preventDefault();
                      navigate(serviceCanadaCentrePage);
                    }}
                  >
                    {t("ServiceCanadaCentreCode.updateInformationButton")}
                  </GcdsButton>
                </GcdsGrid>
              </div>
            </GcdsGrid>
          </GcdsContainer>
        </GcdsContainer>

        <GcdsNotice
          noticeRole="info"
          noticeTitleTag="h2"
          noticeTitle={t("ServiceCanadaCentreCode.findNearestTitle")}
        >
          <GcdsText marginBottom="0">
            {t("ServiceCanadaCentreCode.findNearestBody")}{" "}
            {
              //TODO: populate with real URL once available
            }
            <GcdsLink href="#" external>
              {t("ServiceCanadaCentreCode.findNearestLink")}
            </GcdsLink>
            .
          </GcdsText>
        </GcdsNotice>
      </GcdsGrid>
    </GcdsContainer>
  );
}
