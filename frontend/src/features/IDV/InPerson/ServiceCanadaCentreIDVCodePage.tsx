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
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

type ServiceCanadaCentreIDVCodePageLocationState = {
  idvCode?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  idType?: string;
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
  const firstName = locationState?.firstName?.trim() || "--";
  const lastName = locationState?.lastName?.trim() || "--";
  const dateOfBirth = locationState?.dateOfBirth?.trim() || "--";
  const idSelected = locationState?.idType?.trim() || "--";

  const handlePrintPage = () => {};

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  if (!idvCode) {
    return <Navigate to={serviceCanadaCentrePage} replace />;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsHeading tag="h1" marginTop="0">
          {t("ServiceCanadaCentreCode.heading")}
        </GcdsHeading>

        <GcdsHeading tag="h2" marginBottom="0" marginTop="0">
          <strong>{idvCode}</strong>
        </GcdsHeading>
        <GcdsContainer>
          {" "}
          <GcdsText>
            {t("ServiceCanadaCentreCode.codeValidDays")}{" "}
            <strong>{email}</strong>.
          </GcdsText>
          <GcdsText marginBottom="0">
            {t("ServiceCanadaCentreCode.visitInstruction")}
          </GcdsText>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ServiceCanadaCentreCode.yourInformationHeading")}
          </GcdsHeading>

          <GcdsContainer>
            <GcdsGrid columns="1" gap="150">
              <div>
                <GcdsText marginTop="300" marginBottom="0">
                  <strong>{t("ServiceCanadaCentreCode.firstName")}</strong>
                </GcdsText>
                <GcdsText marginTop="200" marginBottom="0">
                  {firstName}
                </GcdsText>
              </div>

              <div className="separator" style={{ margin: "0" }} />

              <div>
                <GcdsText>
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
                  {idSelected}
                </GcdsText>
              </div>

              <div className="separator" style={{ margin: "0" }} />

              <div style={{ marginTop: "1.5rem" }}>
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
            <GcdsLink href={"#"} external={true}>
              {t("ServiceCanadaCentreCode.findNearestLink")}
            </GcdsLink>
            .
          </GcdsText>
        </GcdsNotice>
      </GcdsGrid>
    </GcdsContainer>
  );
}
