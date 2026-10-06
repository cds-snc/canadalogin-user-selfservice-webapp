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

import {
  AVAILABLE_LANGUAGES,
  DEV_ONLY_FEATURE,
  PAGES,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import InPersonRadioButtons from "../components/InPersonRadioButtons";
import { IN_PERSON_METHOD, type InPersonMethod } from "../components/methods";
import { useRelyingPartyInfo } from "../../../hooks/useRelyingPartyInfo";
import ErrorSummaryWithFocus from "../../../components/ErrorSummaryWithFocus/ErrorSummaryWithFocus";
import {
  getSelectOptionRequiredMessage,
  getValidationSummaryHeading,
} from "./validation/ErrorsDefinition";

const ERROR_SUMMARY_ID = "prove-identity-in-person-error-summary";
const RADIOS_ID = "prove-identity-in-person-radios";

export default function ProveIdentityInPersonPage() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const { t } = useTranslation("idv");

  const [selectedMethod, setSelectedMethod] = useState<InPersonMethod>();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [summaryFocusTrigger, setSummaryFocusTrigger] = useState(0);

  const { relyingPartyName: rpName } = useRelyingPartyInfo();
  const currentLanguage =
    language === AVAILABLE_LANGUAGES.fr
      ? AVAILABLE_LANGUAGES.fr
      : AVAILABLE_LANGUAGES.en;
  const selectMethodErrorMessage =
    hasSubmitted && !selectedMethod ? getSelectOptionRequiredMessage(t) : "";

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
    setHasSubmitted(true);

    if (!selectedMethod) {
      setSummaryFocusTrigger((previous) => previous + 1);
      return;
    }

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

          {selectMethodErrorMessage ? (
            <ErrorSummaryWithFocus
              key={summaryFocusTrigger}
              id={ERROR_SUMMARY_ID}
              errorMessage={getValidationSummaryHeading(t)}
              errorLinks={{ [`#${RADIOS_ID}`]: selectMethodErrorMessage }}
              language={currentLanguage}
            />
          ) : null}

          <InPersonRadioButtons
            id={RADIOS_ID}
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
            errorMessage={selectMethodErrorMessage}
          />
        </GcdsContainer>

        <GcdsGrid
          columns="1"
          columnsDesktop="max-content max-content"
          gap="200"
        >
          <GcdsButton
            type="button"
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
