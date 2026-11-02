import {
  GcdsLink,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";

import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import type { UserProfile } from "../../../types/user";
import type { IdentityVerificationClaimsResponse } from "../../IDV/api/identityVerificationApi";

type DataInformationCardProps = {
  userProfile: UserProfile | null;
  verifiedClaims?: NonNullable<
    IdentityVerificationClaimsResponse["verified_claims"]
  >;
};

export default function DataInformationCard({
  userProfile,
}: DataInformationCardProps) {
  const { t } = useTranslation("dataTransparency");

  const preferredName =
    userProfile?.name?.formatted ||
    [userProfile?.name?.givenName, userProfile?.name?.familyName]
      .filter(Boolean)
      .join(" ") ||
    "N/A";

  const email = userProfile?.emails?.[0]?.value || "N/A";
  const languagePreference =
    userProfile?.preferredLanguage === "fr" ? "Français" : "English";

  const sections = [
    {
      key: "preferredName",
      title: t("DataInformationCard.preferredName"),
      value: preferredName,
    },
    {
      key: "languagePreference",
      title: t("DataInformationCard.languagePreference"),
      value: languagePreference,
    },
    {
      key: "emailAddress",
      title: t("DataInformationCard.emailAddress"),
      value: email,
    },
  ];

  return (
    <GcdsContainer className="sectionCard">
      <GcdsGrid columns="1" gap="300">
        {sections.map((section, index) => (
          <Fragment key={section.key}>
            {index > 0 && (
              <GcdsContainer className="separator" style={{ margin: "0" }} />
            )}
            <GcdsContainer>
              <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
                {section.title}
              </GcdsHeading>
              <GcdsText marginTop="200" marginBottom="0">
                {section.value}
              </GcdsText>
            </GcdsContainer>
          </Fragment>
        ))}
        <GcdsContainer className="separator" style={{ margin: "0" }} />
        <GcdsContainer>
          <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
            {t("DataInformationCard.wrongInformation")}
          </GcdsHeading>
          <GcdsText marginTop="200" marginBottom="0">
            <GcdsLink href="#">
              {t("DataInformationCard.updateLink")}
            </GcdsLink>
          </GcdsText>
        </GcdsContainer>
      </GcdsGrid>
    </GcdsContainer>
  );
}
