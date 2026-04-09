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
import {
  EXTERNAL_NAVIGATION_LINKS,
  LANGUAGE_DISPLAY_NAMES,
} from "../../../utils/constants";
import { useUser } from "../../../components/Providers/useUser";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import { authService } from "../../../services/authService";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type { LanguagePreferenceSuccessProps } from "../../../types/languagePreference";
import type {
  AuthServiceResponse,
  LogoutResponseData,
} from "../../../types/services";

export default function SuccessfullyUpdated({
  languageFormData,
  onBackToProfile,
}: LanguagePreferenceSuccessProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";
  const { state, dispatch } = useUser();
  const { setLoading } = userProfileDispatch(dispatch);
  const { t } = useTranslation("language");
  const preferredLanguage = state?.userProfile?.preferredLanguage || "";

  const handleSignout = async (event: Event) => {
    event.preventDefault();
    setLoading(true, t("SuccessfullyUpdatedLanguage.signingOut"));

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
      setLoading(true, t("SuccessfullyUpdatedLanguage.signOutFailed"));
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const onSubmitHandler = (event: Event | CustomEvent<string | void>) => {
    event.preventDefault();
    void onBackToProfile();
  };

  if (!languageFormData?.languageCode) {
    return null;
  }

  const displayLanguageName =
    LANGUAGE_DISPLAY_NAMES[routeLanguage]?.[
      preferredLanguage as keyof (typeof LANGUAGE_DISPLAY_NAMES)["en"]
    ] || languageFormData.updatedPreferredLanguage;

  return (
    <GcdsContainer role="main">
      <GcdsText>
        <GcdsNotice noticeRole="success" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            <strong>
              {t("SuccessfullyUpdatedLanguage.languageUpdatedTo")}{" "}
              {displayLanguageName}
            </strong>
          </GcdsText>
        </GcdsNotice>
      </GcdsText>

      <GcdsHeading tag="h1">
        {t("SuccessfullyUpdatedLanguage.updateOtherPlaces")}
      </GcdsHeading>
      <GcdsHeading tag="h4">
        {t("SuccessfullyUpdatedLanguage.onlyConnectedServices")}
      </GcdsHeading>
      <GcdsText>{t("SuccessfullyUpdatedLanguage.notConnectedNotice")}</GcdsText>
      <GcdsText>
        {t("SuccessfullyUpdatedLanguage.searchOtherAccounts")}{" "}
        <GcdsLink href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}>
          {t("SuccessfullyUpdatedLanguage.gcAccountDirectory")}
        </GcdsLink>
      </GcdsText>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          style={{ width: "fit-content" }}
          onGcdsClick={onSubmitHandler}
          currentLang={routeLanguage}
        >
          {t("SuccessfullyUpdatedLanguage.backToProfile")}
        </SubmitButton>
        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={(event: Event) => {
            void handleSignout(event);
          }}
        >
          {t("SuccessfullyUpdatedLanguage.signOut")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
