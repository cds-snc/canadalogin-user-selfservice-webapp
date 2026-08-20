import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";

import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { DEV_ONLY_FEATURE, PAGES } from "../../utils/constants";
import { path } from "../../utils/routeHelpers";
import { IDV_JOURNEY_TYPE } from "./constants";
import type { IdentityVerificationClaimsResponse } from "./api/identityVerificationApi";
import { formatDateOfBirthForDisplay } from "./InPerson/validation/InPersonIdentity.validation";

type ProvenInformationCardProps = {
  claims?: NonNullable<IdentityVerificationClaimsResponse["verified_claims"]>;
};

export default function ProvenInformationCard({
  claims,
}: ProvenInformationCardProps) {
  const { t, i18n } = useTranslation("profile");
  const navigate = useNavigate();
  const { language } = useParams();
  const name = [claims?.claims?.given_name, claims?.claims?.family_name]
    .filter(Boolean)
    .join(" ");
  const dateOfBirth = claims?.claims?.birthdate
    ? formatDateOfBirthForDisplay(claims.claims.birthdate, i18n.language)
    : undefined;
  const idDocument = claims?.claims?.id_document;

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

  const sections = [
    <GcdsContainer>
      <GcdsHeading tag="h3" marginTop="300" marginBottom="0">
        {t("ProvenInformationCard.name")}
      </GcdsHeading>
      <GcdsText marginTop="200" marginBottom="0">
        {name}
      </GcdsText>
    </GcdsContainer>,
    dateOfBirth ? (
      <GcdsContainer>
        <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
          {t("ProvenInformationCard.dateOfBirth")}
        </GcdsHeading>
        <GcdsText marginTop="200" marginBottom="0">
          {dateOfBirth}
        </GcdsText>
      </GcdsContainer>
    ) : null,
    idDocument ? (
      <GcdsContainer>
        <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
          {t("ProvenInformationCard.idDocument")}
        </GcdsHeading>
        <GcdsText marginTop="200" marginBottom="0">
          {idDocument}
        </GcdsText>
      </GcdsContainer>
    ) : null,
    <GcdsGrid columns="1fr auto" className="gridInline">
      <GcdsText marginBottom="300">
        {t("ProvenInformationCard.updateInfo")}
      </GcdsText>
      <GcdsButton
        buttonRole="secondary"
        type="button"
        onGcdsClick={() => {
          navigate(startIdentityVerificationFlow);
        }}
      >
        {t("ProvenInformationCard.updateButton")}
      </GcdsButton>
    </GcdsGrid>,
  ].filter(Boolean);

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
