import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";
import BarcodeDisplay from "../helpers/BarcodeDisplay";
import { useUser } from "../../../components/Providers/useUser";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import AcceptableIdsDetails from "../components/AcceptableIdsDetails";
import { formatDateOfBirthForDisplay } from "./validation/InPersonIdentity.validation";
import {
  APPROVED_DOCUMENT_VALUES,
  type ApprovedDocumentValue,
} from "../data/approvedDocuments";

type ProofingBarcodeCanadaPostState = {
  idvCode?: string;
  email?: string;
  givenName?: string;
  lastName?: string;
  dateOfBirth?: string;
  idSelected?: string;
  acceptableIds?: string[];
  verificationExpiresAt?: string;
  verificationValidityDays?: number;
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

  const locationState =
    (location.state as ProofingBarcodeCanadaPostState | null) ?? null;

  const barcodeValue = "CP387DHROGJ";

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
  const rawIdSelected = locationState?.idSelected?.trim() || "";
  const idSelected = rawIdSelected
    ? isApprovedDocumentValue(rawIdSelected)
      ? t(`ApprovedDocuments.${rawIdSelected}`)
      : rawIdSelected
    : "--";

  const acceptableIds = locationState?.acceptableIds;

  const formattedExpiryDate = verificationExpiresAt
    ? new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(verificationExpiresAt))
    : new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(t("ProofingBarcodeCanadaPost.codeValidityDate")));

  const codeValidityText = formattedExpiryDate
    ? t("ProofingBarcodeCanadaPost.codeValidDaysDynamic", {
        expiryDate: formattedExpiryDate,
        validityDays: verificationValidityDays ?? 30,
      })
    : t("ProofingBarcodeCanadaPost.codeValidDays", {
        validityDays: verificationValidityDays ?? 30,
      });

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1" marginTop="0">
            {t("ProofingBarcodeCanadaPost.heading")}
          </GcdsHeading>

          <BarcodeDisplay
            value={barcodeValue}
            ariaLabel={t("ProofingBarcodeCanadaPost.barcodeAriaLabel", {
              code: barcodeValue,
            })}
            height={120}
            maxWidth="360px"
            widthScale={0.7}
          />
        </GcdsContainer>

        <GcdsContainer>
          <GcdsText>
            {codeValidityText} <strong>{email}</strong>.
          </GcdsText>
          <GcdsText marginBottom="0">
            {t("ProofingBarcodeCanadaPost.visitInstruction", {
              idSelected: idSelected,
            })}
          </GcdsText>
        </GcdsContainer>

        <AcceptableIdsDetails
          detailsTitle={t("ProofingBarcodeCanadaPost.listOfIds")}
          acceptableIds={acceptableIds}
        />

        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ProofingBarcodeCanadaPost.yourInformationHeading")}
          </GcdsHeading>

          <GcdsContainer>
            <GcdsGrid columns="1" gap="300">
              <div>
                <GcdsText marginTop="300" marginBottom="0">
                  <strong>{t("ProofingBarcodeCanadaPost.givenName")}</strong>
                </GcdsText>
                <GcdsText marginTop="200" marginBottom="0">
                  {givenName}
                </GcdsText>
              </div>

              <div className="separator" style={{ margin: "0" }} />

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

              <GcdsGrid columns="1fr auto" className="gridInline">
                <GcdsButton
                  buttonRole="secondary"
                  type="button"
                  onGcdsClick={(event) => {
                    event.preventDefault();
                    navigate(visitCanadaPostPage);
                  }}
                >
                  {t("ProofingBarcodeCanadaPost.updateInformationButton")}
                </GcdsButton>
              </GcdsGrid>
            </GcdsGrid>
          </GcdsContainer>
        </GcdsContainer>

        <GcdsNotice
          noticeRole="info"
          noticeTitleTag="h2"
          noticeTitle={t("ProofingBarcodeCanadaPost.findNearestTitle")}
        >
          <GcdsText marginBottom="0">
            {t("ProofingBarcodeCanadaPost.findNearestBody")}{" "}
            <GcdsLink href="#" external>
              {t("ProofingBarcodeCanadaPost.findNearestLink")}
            </GcdsLink>
            .
          </GcdsText>
        </GcdsNotice>
      </GcdsGrid>
    </GcdsContainer>
  );
}
