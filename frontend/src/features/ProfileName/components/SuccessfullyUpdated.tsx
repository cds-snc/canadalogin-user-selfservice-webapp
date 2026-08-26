import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { EXTERNAL_NAVIGATION_LINKS } from "../../../utils/constants";
import { useUser } from "../../../components/Providers/useUser";
import { authService } from "../../../services/authService";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type { ProfileNameSuccessProps } from "../../../types/profileName";
import type {
  AuthServiceResponse,
  LogoutResponseData,
} from "../../../types/services";

export default function SuccessfullyUpdated({
  nameFormData,
  onBackToProfile,
}: ProfileNameSuccessProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";

  const { dispatch } = useUser();
  const { t } = useTranslation("profile");

  const { setLoading } = userProfileDispatch(dispatch);
  const username = nameFormData?.formatted || "";

  const handleSignout = async (event: Event) => {
    event.preventDefault();
    setLoading(true, t("ProfileUpdateNameSuccess.signingOut"));

    try {
      const response = (await authService.logout()) as
        | AuthServiceResponse<LogoutResponseData>
        | undefined;
      const redirectUrl = response?.data?.redirect_url || null;

      if (redirectUrl) {
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(true, t("ProfileUpdateNameSuccess.signOutFailed"));
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const onSubmitHandler = (event: Event | CustomEvent<string | void>) => {
    event.preventDefault();
    void onBackToProfile();
  };

  return (
    <GcdsContainer role="main">
      <GcdsText>
        <GcdsNotice noticeRole="success" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            <strong>
              {t("ProfileUpdateNameSuccess.nameUpdatedTo")} {username}
            </strong>
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
      <GcdsHeading tag="h1">
        {t("ProfileUpdateNameSuccess.updateOtherPlaces")}
      </GcdsHeading>
      <GcdsHeading tag="h4">
        {t("ProfileUpdateNameSuccess.onlyConnectedServices")}
      </GcdsHeading>
      <GcdsText>{t("ProfileUpdateNameSuccess.notConnectedNotice")}</GcdsText>
      <GcdsText>
        {t("ProfileUpdateNameSuccess.searchOtherAccounts")}{" "}
        <GcdsLink
          href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}
          target="_blank"
        >
          {t("ProfileUpdateNameSuccess.gcAccountDirectory")}
        </GcdsLink>
      </GcdsText>
      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          currentLang={routeLanguage}
          style={{ width: "fit-content" }}
          onGcdsClick={onSubmitHandler}
        >
          {t("ProfileUpdateNameSuccess.backToProfile")}
        </SubmitButton>
        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={handleSignout}
        >
          {t("ProfileUpdateNameSuccess.signOut")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
