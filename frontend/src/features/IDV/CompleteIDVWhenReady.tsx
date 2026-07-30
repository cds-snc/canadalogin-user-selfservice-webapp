import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
  GcdsContainer,
  GcdsDetails,
} from "@gcds-core/components-react";

import { DEV_ONLY_FEATURE, PAGES } from "../../utils/constants";
import { path } from "../../utils/routeHelpers";
import { useUser } from "../../components/Providers/useUser";
import { authService } from "../../services/authService";
import { userProfileDispatch } from "../../utils/userProfileDispatch";
import { useRelyingPartyInfo } from "../../hooks/useRelyingPartyInfo";
import { APPROVED_DOCUMENT_VALUES_WITHOUT_NO_IDS } from "./data/approvedDocuments";

export default function CompleteIdentityProofingPage() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const { dispatch } = useUser();
  const { setLoading } = userProfileDispatch(dispatch);

  const { t } = useTranslation("idv");
  const { t: tCommon } = useTranslation("common");
  const appName = tCommon("RelyingParty.canadaLogin");
  const { relyingPartyName: relyingPartyLinkName, hasRelyingParty } = useRelyingPartyInfo();
  const heading = hasRelyingParty
    ? t("CompleteIdentityProofing.headingWithRpName", {
        rpName: relyingPartyLinkName,
      })
    : t("CompleteIdentityProofing.headingWithoutRpName");

  const handleStartIdentityProofing = () => {
    navigate(
      path(PAGES.idvStartIdentityProofingPage, { language, journeyType }),
    );
  };

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
          <GcdsHeading tag="h1">{heading}</GcdsHeading>
          <GcdsText>
            <strong>
              {t("CompleteIdentityProofing.accessRPServicePortalTitle", {
                rpServicePortal: relyingPartyLinkName,
              })}
            </strong>
          </GcdsText>
          <GcdsText>
            {t("CompleteIdentityProofing.accessRPServicePortalText", {
              appName,
            })}
          </GcdsText>
          <GcdsText>
            {t("CompleteIdentityProofing.noDocumentsNoticeText")}
            <GcdsLink href="#" external size="regular">
              {t("CompleteIdentityProofing.contactLink", {
                rpServicePortal: relyingPartyLinkName,
              })}
            </GcdsLink>
          </GcdsText>
          <GcdsText>
            <GcdsDetails
              detailsTitle={t("CompleteIdentityProofing.listOfAcceptableIds")}
            >
              <ol
                aria-label={t("CompleteIdentityProofing.listOfAcceptableIds")}
              >
                {APPROVED_DOCUMENT_VALUES_WITHOUT_NO_IDS.map((docValue) => (
                  <li key={docValue}>{t(`ApprovedDocuments.${docValue}`)}</li>
                ))}
              </ol>
            </GcdsDetails>
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
        </GcdsContainer>
      </GcdsGrid>
    </GcdsContainer>
  );
}
