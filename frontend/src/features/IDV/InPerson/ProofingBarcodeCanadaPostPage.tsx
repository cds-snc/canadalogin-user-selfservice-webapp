import {
  GcdsButton,
  GcdsContainer,
  GcdsDetails,
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

type ProofingBarcodeCanadaPostState = {
  idvCode?: string;
  email?: string;
  givenName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  idSelected?: string;
  acceptableIds?: string[];
};

export default function ProofingBarcodeCanadaPostPage() {
  const { t } = useTranslation("idv");
  const { language, journeyType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useUser();

  const locationState =
    (location.state as ProofingBarcodeCanadaPostState | null) ?? null;

  const barcodeValue = "CP387DHROGJ";

  const startIdentityProofingPage = path(PAGES.idvStartIdentityProofingPage, {
    language,
    journeyType,
  });

  const email = state?.userProfile?.userName ?? "";
  const givenName = locationState?.givenName?.trim() || "--";
  const lastName = locationState?.lastName?.trim() || "--";
  const dateOfBirth = locationState?.dateOfBirth?.trim() || "--";
  const address = locationState?.address?.trim() || "--";
  const idSelected = locationState?.idSelected?.trim() || "--";

  const acceptableIds =
    locationState?.acceptableIds && locationState.acceptableIds.length > 0
      ? locationState.acceptableIds
      : [
          t("ProofingBarcodeCanadaPost.acceptableIdOption1"),
          t("ProofingBarcodeCanadaPost.acceptableIdOption2"),
          t("ProofingBarcodeCanadaPost.acceptableIdOption3"),
        ];

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
            {t("ProofingBarcodeCanadaPost.codeValidDays")}{" "}
            <strong>{email}</strong>
          </GcdsText>
          <GcdsText>{t("ProofingBarcodeCanadaPost.visitInstruction")}</GcdsText>
        </GcdsContainer>

        <GcdsDetails detailsTitle={t("ProofingBarcodeCanadaPost.listOfIds")}>
          <GcdsText>
            <ul>
              {acceptableIds.map((acceptableId) => (
                <li key={acceptableId}>{acceptableId}</li>
              ))}
            </ul>
          </GcdsText>
        </GcdsDetails>

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
                  <strong>{t("ProofingBarcodeCanadaPost.address")}</strong>
                </GcdsText>
                <GcdsText marginTop="200" marginBottom="0">
                  {address}
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
                    navigate(startIdentityProofingPage);
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
