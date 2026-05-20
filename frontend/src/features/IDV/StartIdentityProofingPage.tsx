import { useState } from "react";
import { useNavigate } from "react-router";
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
import { DEV_ONLY_FEATURE } from "../../utils/constants";
import { identityVerificationApi } from "./api/identityVerificationApi";
import OnlineRadioButtons, {
  type IdvMethod,
} from "./components/OnlineRadioButtons";
import InPersonRadioButtons, {
  type InPersonMethod,
} from "./components/InPersonRadioButtons";

export default function StartIdentityProofingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("idv");
  const { t: tLayout } = useTranslation("layout");
  const [onlineSelectedMethod, setOnlineSelectedMethod] = useState<IdvMethod>();
  const [inPersonSelectedMethod, setInPersonSelectedMethod] =
    useState<InPersonMethod>();

  const handleOnlineMethodChange = (method: IdvMethod) => {
    setOnlineSelectedMethod(method);
    setInPersonSelectedMethod(undefined);
  };

  const handleInPersonMethodChange = (method: InPersonMethod) => {
    setInPersonSelectedMethod(method);
    setOnlineSelectedMethod(undefined);
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
              identityVerificationApi
                .getOnlineIdentityVerificationUrl()
                .then((response) => {
                  const { redirect_url } = (
                    response as { data: { redirect_url: string } }
                  ).data;
                  window.location.href = redirect_url;
                });
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
