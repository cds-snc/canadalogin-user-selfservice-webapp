import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
  GcdsContainer,
  GcdsNotice,
} from "@gcds-core/components-react";

import { DEV_ONLY_FEATURE, PAGES } from "../../utils/constants";
import { path } from "../../utils/routeHelpers";
import IdentityProofingRadioButtons from "./components/IdentityProofingRadioButtons";
import { IDV_JOURNEY_TYPE } from "./constants";
import {
  START_IDENTITY_OPTION,
  type StartIdentityOption,
} from "./components/methods";

export default function StartIdentityProofingPage() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();

  const { t } = useTranslation("idv");
  const { t: tLayout } = useTranslation("layout");
  const [selectedOption, setSelectedOption] = useState<StartIdentityOption>();
  const isRequiredJourney =
    (journeyType ?? "").toLowerCase() === IDV_JOURNEY_TYPE.REQUIRED;
  const onlineVerificationInfoPage = path(PAGES.idvOnlineVerificationInfoPage, {
    language,
    journeyType,
  });
  const visitCanadaPostPage = path(PAGES.idvVisitCanadaPostPage, {
    language,
    journeyType,
  });

  const cantProveIdentity = path(PAGES.idvCompleteIdentityProofingPage, {
    language,
    journeyType,
  });
  // placeholder for now, since no in-person main page exists
  const handleContinue = () => {
    switch (selectedOption) {
      case START_IDENTITY_OPTION.online:
        navigate(onlineVerificationInfoPage);
        break;
      case START_IDENTITY_OPTION.inPerson:
        navigate(visitCanadaPostPage);
        break;
      case START_IDENTITY_OPTION.cantProveNow:
        navigate(cantProveIdentity);
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
          {isRequiredJourney && (
            <GcdsNotice
              noticeRole="success"
              noticeTitleTag="h2"
              noticeTitle={t("StartIdentityProofing.signedInNotice")}
              style={{ marginBottom: "var(--gcds-spacing-300)" }}
            >
              <GcdsText>{""}</GcdsText>
            </GcdsNotice>
          )}
          <GcdsHeading tag="h1">
            {t("StartIdentityProofing.pageTitle")}
          </GcdsHeading>
          <GcdsText>
            {t("StartIdentityProofing.heading", {
              appName: tLayout("TopNavBar.appName"),
            })}
          </GcdsText>
          <GcdsLink href="#" external size="regular">
            {t("StartIdentityProofing.learnMoreDescription")}
          </GcdsLink>
          <GcdsHeading tag="h2" marginTop="300" characterLimit={false}>
            {t("StartIdentityProofing.howToProveHeading")}
          </GcdsHeading>
          <IdentityProofingRadioButtons
            selectedOption={selectedOption}
            onOptionChange={setSelectedOption}
          />
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            type="button"
            disabled={!selectedOption}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              handleContinue();
            }}
          >
            {t("ServiceCanadaCentre.continueButton")}
          </GcdsButton>
          <GcdsButton
            buttonRole="secondary"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              // back to Relying Party page? For now, navigate to account settings page
              navigate("/");
            }}
          >
            {t("Button.cancel", { ns: "common" })}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
