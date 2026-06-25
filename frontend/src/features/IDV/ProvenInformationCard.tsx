import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useUser } from "../../components/Providers/useUser";
import { DEV_ONLY_FEATURE, PAGES } from "../../utils/constants";
import { path } from "../../utils/routeHelpers";
import { IDV_JOURNEY_TYPE } from "./constants";

export default function ProvenInformationCard() {
  const { t } = useTranslation("profile");
  const navigate = useNavigate();
  const { language } = useParams();
  const { state } = useUser();
  const name = state?.userProfile?.name?.formatted || "";

  const startIdentityVerificationFlow = path(
    PAGES.idvStartIdentityProofingPage,
    {
      language: language,
      journeyType: IDV_JOURNEY_TYPE.UPDATE,
    },
  );

  // TODO: populate from IDV API once available
  const dateOfBirth = "February 1, 1990";
  const idDocument = "Passport: Expires June 25, 2030";

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer className="sectionCard">
      <GcdsGrid columns="1" gap="300">
        <GcdsContainer>
          <GcdsHeading tag="h3" marginTop="300" marginBottom="0">
            {t("ProvenInformationCard.name")}
          </GcdsHeading>
          <GcdsText marginTop="200" marginBottom="0">
            {name}
          </GcdsText>
        </GcdsContainer>

        <GcdsContainer className="separator" style={{ margin: "0" }} />

        <GcdsContainer>
          <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
            {t("ProvenInformationCard.dateOfBirth")}
          </GcdsHeading>
          <GcdsText marginTop="200" marginBottom="0">
            {dateOfBirth}
          </GcdsText>
        </GcdsContainer>

        <div className="separator" style={{ margin: "0" }} />

        <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
          {t("ProvenInformationCard.idDocument")}
        </GcdsHeading>
        <GcdsText marginTop="200" marginBottom="0">
          {idDocument}
        </GcdsText>

        <div className="separator" style={{ margin: "0" }} />

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
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
