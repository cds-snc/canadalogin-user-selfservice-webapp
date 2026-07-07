import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsGrid,
  GcdsHeading,
  GcdsContainer,
} from "@gcds-core/components-react";

import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import OnlineRadioButtons from "../components/OnlineRadioButtons";
import { ONLINE_IDV_METHOD, type IdvMethod } from "../components/methods";

export default function ProveIdentityOnlinePage() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const { t } = useTranslation("idv");

  const [selectedMethod, setSelectedMethod] = useState<IdvMethod>();

  const onlineVerificationInfoPage = path(PAGES.idvOnlineVerificationInfoPage, {
    language,
    journeyType,
  });
  const provincialVerificationPage = path(PAGES.idvProvincialVerificationPage, {
    language,
    journeyType,
  });
  const startIdentityProofingPage = path(PAGES.idvStartIdentityProofingPage, {
    language,
    journeyType,
  });

  const handleContinue = () => {
    switch (selectedMethod) {
      case ONLINE_IDV_METHOD.documentScanning:
        navigate(onlineVerificationInfoPage);
        break;
      case ONLINE_IDV_METHOD.provincialPartner:
        navigate(provincialVerificationPage);
        break;
      default:
        break;
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleContinue();
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsHeading tag="h1">{t("ProveIdentityOnline.heading")}</GcdsHeading>

        <form onSubmit={handleSubmit}>
          <OnlineRadioButtons
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
          />

          <GcdsGrid
            columns="1"
            columnsDesktop="max-content max-content"
            gap="200"
          >
            <GcdsButton type="submit" disabled={!selectedMethod}>
              {t("ProveIdentityOnline.continueButton")}
            </GcdsButton>
            <GcdsButton
              type="button"
              buttonRole="secondary"
              onClick={() => {
                navigate(startIdentityProofingPage);
              }}
            >
              {t("ProveIdentityOnline.backButton")}
            </GcdsButton>
          </GcdsGrid>
        </form>
      </GcdsGrid>
    </GcdsContainer>
  );
}
