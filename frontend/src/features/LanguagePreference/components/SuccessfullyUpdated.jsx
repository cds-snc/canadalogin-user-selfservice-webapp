import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router";

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
import { path } from "../../../utils/routeHelpers.js";
import { PAGES, LANGUAGE_DISPLAY_NAMES } from "../../../utils/constants.jsx";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";
import { authService } from "../../../services/authService.jsx";

export default function SuccessfullyUpdatedLanguage() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { setLoading } = userProfileDispatch(dispatch);
  const pageContentJson = getPageContent(
    language,
    PAGES.successfullyUpdatedLanguage,
  );
  const backToProfile = path(PAGES.ProfileHome, { language: language });
  const location = useLocation();
  const navigate = useNavigate();
  const [savedLocationState, setSavedLocationState] = useState(null);
  const updatedLanguage = savedLocationState?.updatedLanguage;
  const preferredLanguage = state?.userProfile?.preferredLanguage || "";
  const editLanguagePreferences = path(PAGES.editLanguagePreferences, {
    language: language,
  });

  const handleSignout = async (e) => {
    e.preventDefault();
    setLoading(true, pageContentJson["12"]);

    try {
      const response = await authService.logout();

      // Check if response has redirect_url and redirect
      if (response && response.data && response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
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

  useEffect(() => {
    // redirect to edit page if no updatedLanguage data
    if (location?.state?.updatedLanguage) {
      // save location state to local state, when the language is toggled the location.state is null
      setSavedLocationState(location.state);
    } else {
      navigate(editLanguagePreferences);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!updatedLanguage?.languageCode) return null;

  return (
    <GcdsContainer>
      <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=" ">
        <GcdsText>
          <strong>
            {pageContentJson["1"]}{" "}
            {LANGUAGE_DISPLAY_NAMES[language][preferredLanguage]}
          </strong>
        </GcdsText>
      </GcdsNotice>
      <GcdsHeading tag="h1">{pageContentJson["2"]}</GcdsHeading>
      <GcdsHeading tag="h4">{pageContentJson["3"]}</GcdsHeading>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <GcdsText>
        {pageContentJson["5"]}{" "}
        <GcdsLink href="#">{pageContentJson["8"]}</GcdsLink>
      </GcdsText>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            navigate(backToProfile);
          }}
        >
          {pageContentJson["6"]}
        </GcdsButton>
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
