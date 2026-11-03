import {
  GcdsLink,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
  GcdsDetails,
} from "@gcds-core/components-react";

import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import type { IdentityVerificationClaimsResponse } from "../../IDV/api/identityVerificationApi";

type DataInformationCardProps = {
  verifiedClaims?: NonNullable<
    IdentityVerificationClaimsResponse["verified_claims"]
  >;
};

export default function DataInformationCard({
  verifiedClaims,
}: DataInformationCardProps) {
  const { t } = useTranslation("dataTransparency");

  const preferredName =
    [verifiedClaims?.claims?.given_name, verifiedClaims?.claims?.family_name]
      .filter(Boolean)
      .join(" ") || "Alex Morgan";

  const sections = [
    {
      key: "preferredName",
      title: t("DataInformationCard.preferredName"),
      value: preferredName,
    },
    {
      key: "languagePreference",
      title: t("DataInformationCard.languagePreference"),
      value: "English",
    },
    {
      key: "emailAddress",
      title: t("DataInformationCard.emailAddress"),
      value: "alex.morgan@gmail.com",
    },
  ];

  return (
    <GcdsContainer>
      <GcdsGrid columns="1" gap="300">
        {sections.map((section, index) => (
          <Fragment key={section.key}>
            {index > 0 && (
              <GcdsContainer
                style={{
                  borderTop: "1px solid #ccc",
                  margin: "0",
                  paddingTop: "300",
                }}
              />
            )}
            <GcdsContainer>
              <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
                {section.title}
              </GcdsHeading>
              <GcdsText
                marginTop="200"
                marginBottom={index === sections.length - 1 ? "400" : "0"}
              >
                {section.value}
              </GcdsText>
            </GcdsContainer>
          </Fragment>
        ))}
      </GcdsGrid>

      <GcdsContainer
        style={{
          borderTop: "1px solid #ccc",
          margin: "0",
          paddingTop: "0",
          marginTop: "300",
        }}
      />

      <div style={{ marginTop: "2rem" }}>
        <GcdsDetails detailsTitle={t("DataInformationCard.wrongInformation")}>
          <GcdsText>
            <GcdsLink href="#">{t("DataInformationCard.updateLink")}</GcdsLink>
          </GcdsText>
        </GcdsDetails>
      </div>
    </GcdsContainer>
  );
}
