import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsGrid,
  GcdsHeading,
  GcdsContainer,
} from "@gcds-core/components-react";

import { AVAILABLE_LANGUAGES, DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import OnlineRadioButtons from "../components/OnlineRadioButtons";
import { ONLINE_IDV_METHOD, type IdvMethod } from "../components/methods";
import ErrorSummaryWithFocus from "../../../components/ErrorSummaryWithFocus/ErrorSummaryWithFocus";
import {
  getSelectOptionRequiredMessage,
  getValidationSummaryHeading,
} from "../InPerson/validation/ErrorsDefinition";

const ERROR_SUMMARY_ID = "prove-identity-online-error-summary";
const RADIOS_ID = "prove-identity-online-radios";

export default function ProveIdentityOnlinePage() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const { t } = useTranslation("idv");

  const [selectedMethod, setSelectedMethod] = useState<IdvMethod>();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [summaryFocusTrigger, setSummaryFocusTrigger] = useState(0);
  const currentLanguage =
    language === AVAILABLE_LANGUAGES.fr
      ? AVAILABLE_LANGUAGES.fr
      : AVAILABLE_LANGUAGES.en;
  const selectMethodErrorMessage =
    hasSubmitted && !selectedMethod ? getSelectOptionRequiredMessage(t) : "";

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
    setHasSubmitted(true);

    if (!selectedMethod) {
      setSummaryFocusTrigger((previous) => previous + 1);
      return;
    }

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

        {selectMethodErrorMessage ? (
          <ErrorSummaryWithFocus
            key={summaryFocusTrigger}
            id={ERROR_SUMMARY_ID}
            errorMessage={getValidationSummaryHeading(t)}
            errorLinks={{ [`#${RADIOS_ID}`]: selectMethodErrorMessage }}
            language={currentLanguage}
          />
        ) : null}

        <form onSubmit={handleSubmit}>
          <OnlineRadioButtons
            id={RADIOS_ID}
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
            errorMessage={selectMethodErrorMessage}
          />

          <GcdsGrid
            columns="1"
            columnsDesktop="max-content max-content"
            gap="200"
          >
            <GcdsButton type="submit">
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

