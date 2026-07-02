import {
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
  GcdsContainer,
  GcdsGrid,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { useUser } from "../../../components/Providers/useUser";
import { DEV_ONLY_FEATURE } from "../../../utils/constants";

// TODO: Remove this fallback once API integration for code generation is available.
const FALLBACK_IN_PERSON_IDV_CODE = "387DHROGJ";

type ServiceCanadaCentreIDVCode = {
  // TODO: replace with real code once API integration is in place
  idvCode?: string;
};

type ServiceCanadaCentreIDVCodePageProps = ServiceCanadaCentreIDVCode;

export default function ServiceCanadaCentreIDVCodePage({
  idvCode,
}: ServiceCanadaCentreIDVCodePageProps) {
  const { state } = useUser();
  const location = useLocation();
  const { t } = useTranslation("idv");

  const email = state?.userProfile?.userName ?? "";
  const stateIdvCode =
    (location.state as ServiceCanadaCentreIDVCode | null)?.idvCode ?? null;
  const displayCode = idvCode ?? stateIdvCode ?? FALLBACK_IN_PERSON_IDV_CODE;

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsHeading tag="h1" marginTop="0">
          {t("ServiceCanadaCentreCode.heading")}
        </GcdsHeading>

        <GcdsHeading tag="h2" marginBottom="0" marginTop="0">
          <strong>{displayCode}</strong>
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
