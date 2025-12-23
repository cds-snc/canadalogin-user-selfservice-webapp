import React from "react";
import { useParams } from "react-router";

import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
  GcdsLink,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions.jsx";
import { PAGES, LANGUAGE_DISPLAY_NAMES } from "../../../utils/constants.jsx";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";
import { authService } from "../../../services/authService.jsx";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";

export default function SuccessfullyUpdated({
  languageFormData,
  onBackToProfile,
}) {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { setLoading } = userProfileDispatch(dispatch);
  const pageContentJson = getPageContent(
    language,
    PAGES.successfullyUpdatedLanguage,
  );
  const preferredLanguage = state?.userProfile?.preferredLanguage || "";

  const handleSignout = async (e) => {
    e.preventDefault();
    setLoading(true, pageContentJson["12"]);

    try {
      const response = await authService.logout();
      const redirectUrl = response?.data?.redirect_url || null;

      // Check if response has redirect_url
      if (redirectUrl) {
        // form been submitted in authService.logout
        return;
      } else {
        // Fallback redirect if no redirect_url provided
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Update loading text to show error
      setLoading(true, pageContentJson["13"]);
      // Redirect after error
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    await onBackToProfile();
  };

  if (!languageFormData?.languageCode) return null;

  return (
    <GcdsContainer role="main">
      <GcdsText>
        {" "}
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            <strong>
              {pageContentJson["1"]}{" "}
              {LANGUAGE_DISPLAY_NAMES[language]?.[preferredLanguage] ||
                languageFormData.updatedPreferredLanguage}
            </strong>
          </GcdsText>
        </GcdsNotice>
      </GcdsText>

      <GcdsHeading tag="h1">{pageContentJson["2"]}</GcdsHeading>
      <GcdsHeading tag="h4">{pageContentJson["3"]}</GcdsHeading>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <GcdsText>
        {pageContentJson["5"]}{" "}
        <GcdsLink href="#">{pageContentJson["8"]}</GcdsLink>
      </GcdsText>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          style={{ width: "fit-content" }}
          onGcdsClick={onSubmitHandler}
          currentLang={language}
        >
          {pageContentJson["6"]}
        </SubmitButton>
        &nbsp;
        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            handleSignout(ev);
          }}
        >
          {pageContentJson["7"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
