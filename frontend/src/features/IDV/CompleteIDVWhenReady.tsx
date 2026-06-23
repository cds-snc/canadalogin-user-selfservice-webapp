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
import { useUser } from "../../components/Providers/useUser";
import { authService } from "../../services/authService";
import { userProfileDispatch } from "../../utils/userProfileDispatch";

export default function CompleteIdentityProofingPage() {
  const navigate = useNavigate();
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { setLoading } = userProfileDispatch(dispatch);

  const { t, i18n } = useTranslation("idv");
  const appName = t("CompleteIdentityProofing.appName");

  const handleStartIdentityProofing = () => {
    navigate(path(PAGES.idvStartIdentityProofingPage, { language }));
  };

  const rpInfo = state.relyingPartyInfo;
  const localizedDetail = rpInfo?.localized?.[i18n.language];
  const relyingPartyLinkName = localizedDetail?.name ?? rpInfo?.linkName ?? "";
  const rpServicePortal = relyingPartyLinkName || appName;

  const handleSignOut = async (event: Event) => {
    event.preventDefault();
    setLoading(true, t("CompleteIdentityProofing.signingOut"));

    try {
      const response = await authService.logout();
      const redirectUrl = response?.data?.redirect_url || null;

      if (redirectUrl) {
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(true, t("CompleteIdentityProofing.signOutFailed"));
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
              appName,
            })}
          </GcdsText>
          <GcdsGrid columns="max-content max-content" gap="200">
            <GcdsButton
              type="button"
              onGcdsClick={(ev: Event) => {
                ev.preventDefault();
                handleStartIdentityProofing();
              }}
            >
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
            noticeRole="warning"
            noticeTitleTag="h2"
            style={{ marginTop: "2rem" }}
            noticeTitle={t("CompleteIdentityProofing.noDocumentsNoticeHeader")}
          >
            <GcdsText>
              {t("CompleteIdentityProofing.noDocumentsNoticeText", {
                rpServicePortal,
              })}
            </GcdsText>
            <GcdsLink href="#" external size="regular">
              {t("CompleteIdentityProofing.contactLink")}
            </GcdsLink>
          </GcdsNotice>
        </GcdsContainer>
      </GcdsGrid>
    </GcdsContainer>
  );
}
