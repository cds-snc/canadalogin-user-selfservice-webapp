import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
  GcdsContainer,
} from "@gcds-core/components-react";

import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import InPersonRadioButtons from "../components/InPersonRadioButtons";
import { IN_PERSON_METHOD, type InPersonMethod } from "../components/methods";
import { useRelyingPartyInfo } from "../../../hooks/useRelyingPartyInfo";

export default function ProveIdentityInPersonPage() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const { t } = useTranslation("idv");

  const [selectedMethod, setSelectedMethod] = useState<InPersonMethod>();

  const { relyingPartyName: rpName } = useRelyingPartyInfo();

  const startIdentityProofingPage = path(PAGES.idvStartIdentityProofingPage, {
    language,
    journeyType,
  });
  const visitCanadaPostPage = path(PAGES.idvVisitCanadaPostPage, {
    language,
    journeyType,
  });
  const serviceCanadaCentrePage = path(PAGES.idvServiceCanadaCentrePage, {
    language,
    journeyType,
  });

  const handleContinue = () => {
    switch (selectedMethod) {
      case IN_PERSON_METHOD.canadaPostLocations:
        navigate(visitCanadaPostPage);
        break;
      case IN_PERSON_METHOD.serviceCanadaLocations:
        navigate(serviceCanadaCentrePage);
        break;
      default:
        break;
    }
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1">
            {t("ProveIdentityInPerson.heading")}
          </GcdsHeading>

          <GcdsText>
            {t("ProveIdentityInPerson.description", {
              rpName: rpName ?? t("StartIdentityProofing.fallbackRpName"),
            })}
          </GcdsText>

          <InPersonRadioButtons
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
          />
        </GcdsContainer>

        <GcdsGrid
          columns="1"
          columnsDesktop="max-content max-content"
          gap="200"
        >
          <GcdsButton
            type="button"
            disabled={!selectedMethod}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              handleContinue();
            }}
          >
            {t("ProveIdentityInPerson.continueButton")}
          </GcdsButton>
          <GcdsButton
            type="button"
            buttonRole="secondary"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              navigate(startIdentityProofingPage);
            }}
          >
            {t("ProveIdentityInPerson.backButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
