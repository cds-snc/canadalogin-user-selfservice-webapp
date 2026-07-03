import {
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
  GcdsContainer,
  GcdsGrid,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useParams } from "react-router";
import { useUser } from "../../../components/Providers/useUser";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

type ServiceCanadaCentreIDVCodePageLocationState = {
  idvCode?: string;
};

export default function ServiceCanadaCentreIDVCodePage() {
  const { state } = useUser();
  const { language, journeyType } = useParams();
  const location = useLocation();
  const { t } = useTranslation("idv");

  const serviceCanadaCentrePage = path(PAGES.idvServiceCanadaCentrePage, {
    language,
    journeyType,
  });

  const email = state?.userProfile?.userName ?? "";
  const idvCode =
    (location.state as ServiceCanadaCentreIDVCodePageLocationState | null)
      ?.idvCode ?? null;

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
