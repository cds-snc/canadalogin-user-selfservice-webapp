import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { DEV_ONLY_FEATURE } from "../../../utils/constants";

const PROOF_OF_ADDRESS_GROUPS = [
  "governmentId",
  "financial",
  "billsHousing",
  "governmentBenefits",
  "other",
] as const;

export default function CanadaPostProofOfAddressPage() {
  const { t } = useTranslation("idv");
  const navigate = useNavigate();

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1">
            {t("CanadaPostProofOfAddress.heading")}
          </GcdsHeading>
          <GcdsText>{t("CanadaPostProofOfAddress.intro")}</GcdsText>

          {PROOF_OF_ADDRESS_GROUPS.map((group) => {
            const items = t(`CanadaPostProofOfAddress.groups.${group}.items`, {
              returnObjects: true,
            }) as string[];

            return (
              <section key={group}>
                <GcdsHeading tag="h2" characterLimit={false}>
                  {t(`CanadaPostProofOfAddress.groups.${group}.title`)}
                </GcdsHeading>
                <GcdsText>
                  <ul>
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </GcdsText>
              </section>
            );
          })}
        </GcdsContainer>

        <GcdsGrid
          columns="1"
          columnsDesktop="max-content max-content"
          gap="200"
        >
          <GcdsButton type="button">
            {t("CanadaPostProofOfAddress.continueButton")}
          </GcdsButton>
          <GcdsButton
            type="button"
            buttonRole="secondary"
            onGcdsClick={(event: Event) => {
              event.preventDefault();
              navigate(-1);
            }}
          >
            {t("CanadaPostProofOfAddress.backButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
