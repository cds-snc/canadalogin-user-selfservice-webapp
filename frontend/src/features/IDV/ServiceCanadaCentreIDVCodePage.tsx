import {
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
  GcdsContainer,
  GcdsGrid,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { useUser } from "../../components/Providers/useUser";

interface ServiceCanadaCentreIDVCodePageProps {
  // TODO: replace with real code once API integration is in place
  idvCode?: string;
}

export default function ServiceCanadaCentreIDVCodePage({
  idvCode,
}: ServiceCanadaCentreIDVCodePageProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const { state } = useUser();
  const { t } = useTranslation("idv");

  const email = state?.userProfile?.userName ?? "";

  const findNearestHref =
    language === "fr"
      ? "https://www.canada.ca/fr/emploi-developpement-social/ministere/portefeuille/service-canada/centres-service.html"
      : "https://www.canada.ca/en/employment-social-development/corporate/portfolio/service-canada/centres.html";

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsHeading tag="h1" marginTop="0">
          {t("ServiceCanadaCentreCode.heading")}
        </GcdsHeading>

        <GcdsText marginBottom="0">
          <strong>{idvCode ?? "387DHROGJ"}</strong>
        </GcdsText>
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
            <GcdsLink href={findNearestHref} external={true}>
              {t("ServiceCanadaCentreCode.findNearestLink")}
            </GcdsLink>
            .
          </GcdsText>
        </GcdsNotice>
      </GcdsGrid>
    </GcdsContainer>
  );
}
