import React from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton, GcdsGrid
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";

import { getPageContent } from "../../utils/functions.jsx";
import { userProfileDispatch } from "../../utils/userProfileDispatch.jsx";

import { PAGES, NAVIGATION_LINKS, CONTEXT_ACTIONS, LANGUAGE_DISPLAY_NAMES } from "../../utils/constants.jsx";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";
import { useUser } from "../Providers/useUser.tsx";
import { authService } from "../../services/authService.jsx";

export default function AreYouSureEditYourLanguage() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { clearEditProfile, updateProfileSuccess } = userProfileDispatch(dispatch);

  const pageContentJson = getPageContent(language, PAGES.areYouSureEditYourLanguage);
  const navigateHelper = useNavigateHelper();
  const successPage = `/${language}${NAVIGATION_LINKS.profileYouMayUpdateLanguage}`;
  const backtoProfile = `/${language}${NAVIGATION_LINKS.profileHome}`;

  const selectedLanguage = state?.editProfile?.preferredLanguage || "";

  const saveUpdatedProfileData = async () => {
    try {
      const response = await authService.update_my_user_profile(state.editProfile);
      if (response) {
        clearEditProfile();
        updateProfileSuccess(response.data);
        return true;
      }
      else {
        // Todo: handle errors
      }
    } catch (err) {
      // Todo: handle errors
      console.log(err);
    }
  };

  console.log("state", state)


  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
      <GcdsText>
        {pageContentJson["2"]} <strong>{LANGUAGE_DISPLAY_NAMES[selectedLanguage]}</strong>.
      </GcdsText>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <ul>
        <li>{pageContentJson["5"]}</li>
        <li>{pageContentJson["10"]}</li>
      </ul>

      <GcdsGrid columns="auto auto" gap="1rem" align-items="center">
        <GcdsButton onGcdsClick={async (ev) => {
          ev.preventDefault();
          const success = await saveUpdatedProfileData();
          if (success) { navigateHelper(successPage) }
          navigateHelper(successPage)
        }}>
          {pageContentJson["8"]}
        </GcdsButton>
        <GcdsButton buttonRole="secondary" onGcdsClick={(ev) => {
          clearEditProfile();
          ev.preventDefault();
          navigateHelper(backtoProfile)
        }}>
          {pageContentJson["9"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
