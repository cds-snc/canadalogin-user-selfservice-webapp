import {
  GcdsLink,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";

import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { DEV_ONLY_FEATURE, PAGES } from "../../utils/constants";
import { path } from "../../utils/routeHelpers";
import { IDV_JOURNEY_TYPE } from "./constants";
import type { IdentityVerificationClaimsResponse } from "./api/identityVerificationApi";
import { format, parseISO } from "date-fns";
import { enCA, frCA } from "date-fns/locale";

type ProvenInformationCardProps = {
  claims?: NonNullable<IdentityVerificationClaimsResponse["verified_claims"]>;
};

export default function ProvenInformationCard({
  claims,
}: ProvenInformationCardProps) {
  const { t, i18n } = useTranslation("profile");
  const { language } = useParams();
  const name = [claims?.claims?.given_name, claims?.claims?.family_name]
    .filter(Boolean)
    .join(" ");
  const birthdate = claims?.claims?.birthdate;
  const dateOfBirth = birthdate
    ? format(
        parseISO(birthdate),
        i18n.language === "fr" ? "do MMMM yyyy" : "MMMM d, yyyy",
        { locale: i18n.language === "fr" ? frCA : enCA },
      )
    : "";
  const idDocument = claims?.claims?.id_document;

  const formatFrenchOrdinalDate = (value: string) => {
    if (i18n.language !== "fr" || !value.startsWith("1er ")) {
      return value;
    }

    return (
      <>
        1<sup>er</sup>
        {value.slice(3)}
      </>
    );
  };

  const startIdentityVerificationFlow = path(
    PAGES.idvStartIdentityProofingPage,
    {
      language: language,
      journeyType: IDV_JOURNEY_TYPE.UPDATE,
    },
  );

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  const DateOfBirthSection = dateOfBirth ? (
    <GcdsContainer>
      <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
        {t("ProvenInformationCard.dateOfBirth")}
      </GcdsHeading>
      <GcdsText marginTop="200" marginBottom="0">
        {formatFrenchOrdinalDate(dateOfBirth)}
      </GcdsText>
    </GcdsContainer>
  ) : null;

  const sections = [
    <GcdsContainer key="name">
      <GcdsHeading tag="h3" marginTop="300" marginBottom="0">
        {t("ProvenInformationCard.name")}
      </GcdsHeading>
      <GcdsText marginTop="200" marginBottom="0">{name}</GcdsText>
    </GcdsContainer>,
    DateOfBirthSection,
    idDocument ? (
      <GcdsContainer key="idDocument">
        <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
          {t("ProvenInformationCard.idDocument")}
        </GcdsHeading>
        <GcdsText marginTop="200" marginBottom="0">{idDocument}</GcdsText>
      </GcdsContainer>
    ) : null,
    <GcdsContainer key="update">
      <GcdsText>{t("ProvenInformationCard.updateInfo")}</GcdsText>
      <GcdsText>
        <GcdsLink href={startIdentityVerificationFlow}>
          {t("ProvenInformationCard.updateButton")}
        </GcdsLink>
      </GcdsText>
    </GcdsContainer>,
  ];

  return (
    <GcdsContainer className="sectionCard">
      <GcdsGrid columns="1" gap="300">
        {sections.map((section, index) => (
          <Fragment key={index}>
            {index > 0 && (
              <GcdsContainer className="separator" style={{ margin: "0" }} />
            )}
            {section}
          </Fragment>
        ))}
      </GcdsGrid>
    </GcdsContainer>
  );
}
