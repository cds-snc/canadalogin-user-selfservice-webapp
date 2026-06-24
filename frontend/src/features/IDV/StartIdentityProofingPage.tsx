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
} from "@gcds-core/components-react";

import { DEV_ONLY_FEATURE, PAGES } from "../../utils/constants";
import { IDV_JOURNEY_TYPE } from "./constants";
import { path } from "../../utils/routeHelpers";
import { useUser } from "../../components/Providers/useUser";
import IdentityProofingRadioButtons from "./components/IdentityProofingRadioButtons";
import {
  START_IDENTITY_OPTION,
  type StartIdentityOption,
} from "./components/methods";

export default function StartIdentityProofingPage() {
  const navigate = useNavigate();
  const { state } = useUser();
  const { language, journeyType } = useParams();

  const { t } = useTranslation("idv");
  const { t: tLayout, i18n } = useTranslation("layout");
  const [selectedOption, setSelectedOption] = useState<StartIdentityOption>();

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

  const rpInfo = state.relyingPartyInfo;
  const localizedDetail = rpInfo?.localized?.[i18n.language];
  const relyingPartyLinkName = localizedDetail?.name ?? rpInfo?.linkName ?? "";
  const appName = tLayout("TopNavBar.appName");
  const rpServicePortal =
    journeyType === IDV_JOURNEY_TYPE.REQUIRED
      ? relyingPartyLinkName || appName
      : appName;

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
          <GcdsHeading tag="h1">
            {t("StartIdentityProofing.heading", {
              rpServicePortal,
            })}
          </GcdsHeading>
          <GcdsText>{t("StartIdentityProofing.description1")}</GcdsText>
          <GcdsText>{t("StartIdentityProofing.description2")}</GcdsText>

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
