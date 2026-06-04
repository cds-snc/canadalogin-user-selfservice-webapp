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

import { identityVerificationApi } from "./api/identityVerificationApi";
import OnlineRadioButtons from "./components/OnlineRadioButtons";
import InPersonRadioButtons from "./components/InPersonRadioButtons";
import { ONLINE_IDV_METHOD, type IdvMethod } from "./components/methods.ts";
import { IN_PERSON_METHOD, type InPersonMethod } from "./components/methods.ts";
import { DEV_ONLY_FEATURE, PAGES } from "../../utils/constants";
import { path } from "../../utils/routeHelpers";

export default function StartIdentityProofingPage() {
  const navigate = useNavigate();
  const { language } = useParams();

  const { t } = useTranslation("idv");
  const { t: tLayout } = useTranslation("layout");
  const [onlineSelectedMethod, setOnlineSelectedMethod] = useState<IdvMethod>();
  const [inPersonSelectedMethod, setInPersonSelectedMethod] =
    useState<InPersonMethod>();

  const serviceCanadaPage = path(PAGES.idvServiceCanadaCentrePage, {
    language: language,
  });

  const onlineVerificationInfoPage = path(PAGES.idvOnlineVerificationInfoPage, {
    language: language,
  });

  const handleOnlineMethodChange = (method: IdvMethod) => {
    setOnlineSelectedMethod(method);
    setInPersonSelectedMethod(undefined);
  };

  const handleInPersonMethodChange = (method: InPersonMethod) => {
    setInPersonSelectedMethod(method);
    setOnlineSelectedMethod(undefined);
  };

  const handleContinue = () => {
    const selected = onlineSelectedMethod ?? inPersonSelectedMethod;

    switch (selected) {
      case ONLINE_IDV_METHOD.documentScanning:
        navigate(onlineVerificationInfoPage);
        break;
      case ONLINE_IDV_METHOD.provincialPartner:
        // TODO: implement provincial partner flow
        navigate(serviceCanadaPage);
        break;
      case IN_PERSON_METHOD.serviceCanadaLocations:
        navigate(serviceCanadaPage);
        break;
      case IN_PERSON_METHOD.canadaPostLocations:
        // TODO: implement Canada Post locations flow
        navigate(serviceCanadaPage);
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
          <OnlineRadioButtons
            selectedMethod={onlineSelectedMethod}
            onMethodChange={handleOnlineMethodChange}
          />

          <GcdsHeading tag="h4" marginTop="300" characterLimit={false}>
            {t("StartIdentityProofing.inPersonOption")}
          </GcdsHeading>
          <GcdsNotice noticeRole="info" noticeTitleTag="h2" noticeTitle=" ">
            <GcdsText>
              {t("StartIdentityProofing.signBackInNotice", {
                appName: tLayout("TopNavBar.appName"),
              })}
            </GcdsText>
          </GcdsNotice>
          <InPersonRadioButtons
            selectedMethod={inPersonSelectedMethod}
            onMethodChange={handleInPersonMethodChange}
          />
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            type="button"
            disabled={!onlineSelectedMethod && !inPersonSelectedMethod}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              handleContinue();
            }}
          >
            {t("ServiceCanadaCentre.continueButton")}
          </GcdsButton>
          <GcdsButton
            buttonRole="secondary"
            style={{ width: "fit-content" }}
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
