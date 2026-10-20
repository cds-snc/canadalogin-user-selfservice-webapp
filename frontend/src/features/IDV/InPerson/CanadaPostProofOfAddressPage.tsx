import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";

import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import type { CanadaPostIdDetailsLocationState } from "./CanadaPostIdDetailsPage";

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
  const location = useLocation();
  const { language, journeyType } = useParams();
  const selectedDocument = (
    location.state as CanadaPostIdDetailsLocationState | null
  )?.document;

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
                <GcdsText characterLimit={false}>
                  <strong>
                    {t(`CanadaPostProofOfAddress.groups.${group}.title`)}
                  </strong>
                </GcdsText>
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
          <GcdsButton
            type="button"
            onGcdsClick={(event: Event) => {
              event.preventDefault();
              if (selectedDocument) {
                navigate(
                  path(PAGES.idvCanadaPostIdDetailsPage, {
                    language,
                    journeyType,
                  }),
                  {
                    state: {
                      document: selectedDocument,
                      proofOfAddressAcknowledged: true,
                    },
                  },
                );
              }
            }}
          >
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
