import React from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton, GcdsGrid
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";

import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import { path } from "../../utils/routeHelpers.js";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";
import { useUser } from "../Providers/useUser.tsx";
import { authService } from "../../services/authService.jsx";
import { userProfileDispatch } from "../../utils/userProfileDispatch.jsx";

export default function ProfileUpdateNameConfirmUpdate() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { clearEditProfile, updateProfileSuccess } = userProfileDispatch(dispatch);
  const pageContentJson = getPageContent(language, PAGES.profileUpdateNameConfirmUpdate);
  const navigateHelper = useNavigateHelper();
  
  const successPage = path(PAGES.profileYouMayUpdateName, { language: language });
  const backToProfile = path(PAGES.ProfileHome, { language: language });

  const username = state?.editProfile?.name.formatted || "";

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
        {pageContentJson["2"]} <strong>{username}</strong>.
      </GcdsText>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <ul>
        <li>{pageContentJson["5"]}</li>
        <li>{pageContentJson["10"]}</li>
      </ul>
      <GcdsNotice type="info" noticeTitleTag="h2" noticeTitle=' '>
        <GcdsText>{pageContentJson["7"]}
          <strong>{pageContentJson["11"]}</strong>
          {pageContentJson["12"]}</GcdsText>
      </GcdsNotice>
      <GcdsGrid columns="auto auto" gap="1rem" align-items="center">
        <GcdsButton onGcdsClick={async (ev) => {
          ev.preventDefault();
          const success = await saveUpdatedProfileData();
          if (success) { navigateHelper(successPage) }
        }}>
          {pageContentJson["8"]}
        </GcdsButton>
        <GcdsButton buttonRole="secondary" onGcdsClick={(ev) => {
          ev.preventDefault();
          clearEditProfile();
          navigateHelper(backToProfile)
        }}>
          {pageContentJson["9"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
