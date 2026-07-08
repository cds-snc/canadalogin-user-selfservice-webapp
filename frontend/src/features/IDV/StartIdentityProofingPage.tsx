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
import {
  START_IDENTITY_OPTION,
  type StartIdentityOption,
} from "./components/methods";
import { useUser } from "../../components/Providers/useUser";
import { IDV_JOURNEY_TYPE } from "./constants";

export default function StartIdentityProofingPage() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();

  const { t, i18n } = useTranslation("idv");
  const { state } = useUser();

  const rpInfo = state.relyingPartyInfo;
  const localizedDetail = rpInfo?.localized?.[i18n.language];
  const rpName = localizedDetail?.name ?? rpInfo?.linkName;
  const titleByJourneyType = {
    [IDV_JOURNEY_TYPE.REQUIRED]: t("StartIdentityProofing.pageTitle", {
      rpName: rpName ?? t("StartIdentityProofing.fallbackRpName"),
    }),
    [IDV_JOURNEY_TYPE.START]: t("StartIdentityProofing.pageTitle", {
      rpName: rpName ?? t("StartIdentityProofing.fallbackRpName"),
    }),
    [IDV_JOURNEY_TYPE.UPDATE]: t("StartIdentityProofing.proveYourIdentity"),
  } as const;
  const requestedJourneyType = journeyType ?? IDV_JOURNEY_TYPE.START;
  const resolvedJourneyType: keyof typeof titleByJourneyType =
    requestedJourneyType in titleByJourneyType
      ? (requestedJourneyType as keyof typeof titleByJourneyType)
      : IDV_JOURNEY_TYPE.START;
  const pageTitle = titleByJourneyType[resolvedJourneyType];
  const { t: tLayout } = useTranslation("layout");
  const [selectedOption, setSelectedOption] = useState<StartIdentityOption>();
  const onlineSelectionPage = path(PAGES.idvProveIdentityOnlinePage, {
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
        navigate(onlineSelectionPage);
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
        {resolvedJourneyType === IDV_JOURNEY_TYPE.REQUIRED && (
          <GcdsNotice
            noticeRole="success"
            noticeTitle={t("StartIdentityProofing.signedInSuccessNotice")}
            noticeTitleTag="h2"
          >
            <GcdsText hidden={true}>{""}</GcdsText>
          </GcdsNotice>
        )}
        {journeyType === IDV_JOURNEY_TYPE.VERIFICATION_ERROR && (
          <GcdsNotice
            noticeRole="danger"
            noticeTitle={t("StartIdentityProofing.errorNoticeTitle")}
            noticeTitleTag="h2"
          >
            <GcdsText>
              {t("StartIdentityProofing.errorNoticeDescription")}
            </GcdsText>
          </GcdsNotice>
        )}
        {journeyType === IDV_JOURNEY_TYPE.START && (
          <GcdsNotice
            noticeRole="success"
            noticeTitle={t("StartIdentityProofing.signedInSuccessNotice")}
            noticeTitleTag="h2"
          >
            <GcdsText hidden={true}>{""}</GcdsText>
          </GcdsNotice>
        )}
        <GcdsContainer>
          <GcdsHeading tag="h1">{pageTitle}</GcdsHeading>
          <GcdsText>
            {t("StartIdentityProofing.heading", {
              appName: tLayout("TopNavBar.appName"),
            })}
          </GcdsText>
          <GcdsText>{t("StartIdentityProofing.bodyText")}</GcdsText>

          <GcdsLink href="#" external size="regular">
            {t("StartIdentityProofing.learnMoreDescription")}
          </GcdsLink>
          <GcdsHeading tag="h2" marginTop="300" characterLimit={false}>
            {t("StartIdentityProofing.howToProveHeading")}
          </GcdsHeading>
          <IdentityProofingRadioButtons
            selectedOption={selectedOption}
            onOptionChange={setSelectedOption}
            rpName={rpName}
          />
        </GcdsContainer>

        <GcdsGrid columns="1" columnsDesktop="max-content max-content">
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
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
