import React, { useEffect } from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton, GcdsGrid
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";

import { getPageContent } from "../../utils/functions.jsx";
import { userProfileDispatch, useCancelLanguageEditing } from "../../utils/userProfileDispatch.jsx";
import { PAGES, NAVIGATION_LINKS, CONTEXT_ACTIONS, LANGUAGE_DISPLAY_NAMES } from "../../utils/constants.jsx";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";
import { useUser } from "../Providers/useUser.tsx";
import { authService } from "../../services/authService.jsx";

export default function AreYouSureEditYourLanguage() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { clearEditProfile, updateProfileSuccess, setCancelProfileEditing } = userProfileDispatch(dispatch);

  const pageContentJson = getPageContent(language, PAGES.areYouSureEditYourLanguage);
  const navigateHelper = useNavigateHelper();

  const backtoProfile = `/${language}`;
  const { handleCancel } = useCancelLanguageEditing(backtoProfile);

  const successPage = `/${language}${NAVIGATION_LINKS.profileYouMayUpdateLanguage}`;

  const selectedLanguage = state?.editProfile?.preferredLanguage || "";

  const saveUpdatedProfileData = async () => {
    try {
      const response = await authService.update_my_user_profile(state.editProfile);
      if (response) {
        updateProfileSuccess(response.data);
        // clearEditProfile();
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

  useEffect(() => {

    return () => {
      // reset the cancel profile editing state when component unmounts
      setCancelProfileEditing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          if (success) {
            navigateHelper(successPage);
          }
        }}>
          {pageContentJson["8"]}
        </GcdsButton>
        <GcdsButton buttonRole="secondary" onGcdsClick={(ev) => {
          ev.preventDefault();
          handleCancel();
        }}>
          {pageContentJson["9"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
