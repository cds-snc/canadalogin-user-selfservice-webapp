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

import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { useUser } from "../../../components/Providers/useUser";
import { authService } from "../../../services/authService";

export default function CompleteIdentityProofingPage() {
  const navigate = useNavigate();
  const { language } = useParams();
  const { state } = useUser();

  const { t, i18n } = useTranslation("idv");
  const { t: tLayout } = useTranslation("layout");

  const localizedRpDetail = state.relyingPartyInfo?.localized?.[i18n.language];
  const rpServicePortal =
    localizedRpDetail?.name ??
    state.relyingPartyInfo?.linkName ??
    tLayout("TopNavBar.appName");

  const startIdentityProofingPage = path(PAGES.idvStartIdentityProofingPage, {
    language: language,
  });

  const handleStartIdentityProofing = () => {
    navigate(startIdentityProofingPage);
  };

  const handleSignOut = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/";
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
            {t("CompleteIdentityProofing.heading")}
          </GcdsHeading>
          <GcdsText>
            <strong>
              {t("CompleteIdentityProofing.accessRPServicePortalTitle", {
                rpServicePortal,
              })}
            </strong>
          </GcdsText>
          <GcdsText>
            {t("CompleteIdentityProofing.accessRPServicePortalText", {
              appName: tLayout("TopNavBar.appName"),
            })}
          </GcdsText>
          <GcdsGrid columns="max-content max-content" gap="200">
            <GcdsButton
              type="button"
              onGcdsClick={(ev) => {
                ev.preventDefault();
                handleStartIdentityProofing();
              }}
            >
              {t("CompleteIdentityProofing.buttonStartIdentity")}
            </GcdsButton>

            <GcdsButton
              buttonRole="secondary"
              onGcdsClick={(ev) => {
                ev.preventDefault();
                void handleSignOut();
              }}
            >
              {t("CompleteIdentityProofing.signOut")}
            </GcdsButton>
          </GcdsGrid>
          <GcdsNotice
            noticeRole="info"
            noticeTitleTag="h2"
            noticeTitle={t(
              "CompleteIdentityProofing.forMoreInformationNoticeHeader",
            )}
          >
            <GcdsLink href="#" external size="regular">
              {t("CompleteIdentityProofing.forMoreInformationNoticeText")}
            </GcdsLink>
          </GcdsNotice>

        </GcdsContainer>
      </GcdsGrid>
    </GcdsContainer>
  );
}
