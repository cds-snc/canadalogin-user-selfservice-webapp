import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { useUser } from "../../components/Providers/useUser";
import { DEV_ONLY_FEATURE } from "../../utils/constants";

export default function ProvenInformationCard() {
  const { t } = useTranslation("profile");
  const { state } = useUser();
  const name = state?.userProfile?.name?.formatted || "";

  // TODO: populate from IDV API once available
  const dateOfBirth = "February 1, 1990";
  const idDocument = "Passport: Expires June 25, 2030";

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer className="sectionCard">
      <GcdsGrid columns="1" gap="300">
        <div>
          <GcdsHeading tag="h3" marginTop="300" marginBottom="0">
            {t("ProvenInformationCard.name")}
          </GcdsHeading>
          <GcdsText marginTop="200" marginBottom="0">
            {name}
          </GcdsText>
        </div>

        <div className="separator" style={{ margin: "0" }} />

        <div>
          <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
            {t("ProvenInformationCard.dateOfBirth")}
          </GcdsHeading>
          <GcdsText marginTop="200" marginBottom="0">
            {dateOfBirth}
          </GcdsText>
        </div>

        <div className="separator" style={{ margin: "0" }} />

        <div>
          <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
            {t("ProvenInformationCard.idDocument")}
          </GcdsHeading>
          <GcdsText marginTop="200" marginBottom="0">
            {idDocument}
          </GcdsText>
        </div>

        <div className="separator" style={{ margin: "0" }} />

        <GcdsGrid columns="1fr auto" className="gridInline">
          <GcdsText marginBottom="300">
            {t("ProvenInformationCard.updateInfo")}
          </GcdsText>
          <GcdsButton
            buttonRole="secondary"
            type="button"
            onGcdsClick={() => {
              // TODO: navigate to IDV re-proofing flow once available
            }}
          >
            {t("ProvenInformationCard.updateButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
