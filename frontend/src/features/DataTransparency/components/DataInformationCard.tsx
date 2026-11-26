import {
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

  const legalName = preferredName;

  const dateOfBirth = verifiedClaims?.claims?.birthdate || "1992-08-14";

  const contactDetails = [
    {
      key: "preferredName",
      title: t("DataInformationCard.preferredName"),
      value: preferredName,
    },
    {
      key: "emailAddress",
      title: t("DataInformationCard.emailAddress"),
      value: "canadalogintester@gmail.com",
    },
    {
      key: "languagePreference",
      title: t("DataInformationCard.languagePreference"),
      value: "English",
    },
    {
      key: "phoneNumber",
      title: t("DataInformationCard.phoneNumber"),
      value: verifiedClaims?.claims?.phone_number || "1 613 530 5489",
    },
  ];

  const identityDetails = [
    {
      key: "legalName",
      title: t("DataInformationCard.legalName"),
      value: legalName,
    },
    {
      key: "dateOfBirth",
      title: t("DataInformationCard.dateOfBirth"),
      value: dateOfBirth,
    },
  ];

  const CheckmarkIcon = () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, marginTop: "0.2rem" }}
    >
      <path
        d="M11.9997 0C18.627 0 23.9999 5.37244 24 11.9997C24 18.6271 18.6271 24 11.9997 24C5.37244 23.9999 0 18.627 0 11.9997C8.43737e-05 5.3725 5.3725 8.43792e-05 11.9997 0ZM9.84844 13.4486L7.69716 11.2967L5.99986 12.994L9.84844 16.8426L17.794 8.89702L16.0973 7.20028L9.84844 13.4486Z"
        fill="#1F7A40"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );

  const renderSection = (title: string, fields: typeof contactDetails) => (
    <div style={{ marginBottom: "1.5rem" }}>
      <GcdsHeading tag="h2" marginTop="0" marginBottom="200">
        {title}
      </GcdsHeading>
      <GcdsGrid columns="1" gap="200">
        {fields.map((field, index) => (
          <Fragment key={field.key}>
            {index > 0 && (
              <GcdsContainer
                style={{
                  borderTop: "1px solid #ccc",
                  margin: "0",
                  paddingTop: "200",
                }}
              />
            )}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <CheckmarkIcon />
              <GcdsContainer style={{ flex: 1 }}>
                <GcdsHeading
                  tag="h4"
                  marginTop="0"
                  marginBottom="50"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <strong>{field.title}</strong>
                </GcdsHeading>
                <GcdsText marginTop="0" marginBottom="0">
                  {field.value}
                </GcdsText>
              </GcdsContainer>
            </div>
          </Fragment>
        ))}
      </GcdsGrid>
    </div>
  );

  return (
    <GcdsContainer>
      {renderSection(
        t("DataInformationCard.contactDetailsHeading"),
        contactDetails,
      )}

      <GcdsContainer
        style={{
          borderTop: "1px solid #ccc",
          margin: "0",
          paddingTop: "1.5rem",
          marginBottom: "1.5rem",
        }}
      />

      {renderSection(
        t("DataInformationCard.identityDetailsHeading"),
        identityDetails,
      )}

      <GcdsContainer
        style={{
          borderTop: "1px solid #ccc",
          margin: "0",
          paddingTop: "1.5rem",
          marginBottom: "1.5rem",
        }}
      />

      <div style={{ marginBottom: "1.5rem" }}>
        <GcdsDetails detailsTitle={t("DataInformationCard.wrongInformation")}>
          <GcdsText>
            {t("DataInformationCard.wrongInformationDescription")}
          </GcdsText>
        </GcdsDetails>
      </div>

      <div>
        <GcdsHeading tag="h2" marginTop="0" marginBottom="200">
          {t("DataInformationCard.neverSharedHeading")}
        </GcdsHeading>
        <GcdsText marginBottom="100">
          {t("DataInformationCard.neverSharedDescription")}
        </GcdsText>
        <ul style={{ marginLeft: "1rem", marginTop: "0.25rem" }}>
          <li>
            <GcdsText marginBottom="0">
              {t("DataInformationCard.passwordDetails")}
            </GcdsText>
          </li>
          <li>
            <GcdsText marginBottom="0">
              {t("DataInformationCard.otherServicesInfo")}
            </GcdsText>
          </li>
        </ul>
      </div>
    </GcdsContainer>
  );
}
