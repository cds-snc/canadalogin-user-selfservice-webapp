import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsIcon,
  GcdsText,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";

import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import type { CanadaPostIdDetailsLocationState } from "./CanadaPostIdDetailsPage";
import "./css/CanadaPostProofOfAddressPage.css";

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
  const locationState =
    location.state as CanadaPostIdDetailsLocationState | null;
  const selectedDocument = locationState?.document;
  const formData = locationState?.formData;

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

          <section
            className="canada-post-proof-warning"
            aria-labelledby="canada-post-proof-warning-heading"
          >
            <GcdsIcon name="warning-triangle" size="h2" aria-hidden="true" />
            <div>
              <GcdsText id="canada-post-proof-warning-heading">
                <strong>{t("CanadaPostProofOfAddress.warningTitle")}</strong>
              </GcdsText>
              <GcdsText>
                {t("CanadaPostProofOfAddress.warningMessage")}
              </GcdsText>
            </div>
          </section>
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
                      formData,
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
