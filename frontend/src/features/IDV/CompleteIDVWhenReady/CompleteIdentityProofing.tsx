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

import { DEV_ONLY_FEATURE } from "../../../utils/constants";
import { useUser } from "../../../components/Providers/useUser";
import { authService } from "../../../services/authService";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";

export default function CompleteIdentityProofingPage() {
  const { state, dispatch } = useUser();
  const { setLoading } = userProfileDispatch(dispatch);

  const { t, i18n } = useTranslation("idv");
  const { t: tLayout } = useTranslation("layout");

  const rpInfo = state.relyingPartyInfo;
  const localizedDetail = rpInfo?.localized?.[i18n.language];
  const relyingPartyLinkName = localizedDetail?.name ?? rpInfo?.linkName ?? "";
  const rpServicePortal = relyingPartyLinkName || tLayout("TopNavBar.appName");

  const handleSignOut = async (event: Event) => {
    event.preventDefault();
    setLoading(true, tLayout("TopNavBar.signingOut"));

    try {
      const response = await authService.logout();
      const redirectUrl = response?.data?.redirect_url || null;

      if (redirectUrl) {
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(true, tLayout("TopNavBar.signOutFailed"));
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
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
            <GcdsButton type="button" href="#">
              {t("CompleteIdentityProofing.buttonStartIdentity")}
            </GcdsButton>

            <GcdsButton
              buttonRole="secondary"
              onGcdsClick={(event: Event) => {
                void handleSignOut(event);
              }}
            >
              {t("CompleteIdentityProofing.signOut")}
            </GcdsButton>
          </GcdsGrid>
          <GcdsNotice
            noticeRole="info"
            noticeTitleTag="h2"
            style={{ marginTop: "2rem" }}
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
