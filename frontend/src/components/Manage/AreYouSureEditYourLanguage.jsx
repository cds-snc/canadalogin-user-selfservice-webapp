import React, { useEffect } from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";

import { getPageContent } from "../../utils/functions.jsx";
import {
  userProfileDispatch,
  useCancelLanguageEditing,
} from "../../utils/userProfileDispatch.jsx";
import { path } from "../../utils/routeHelpers.js";
import { PAGES, LANGUAGE_DISPLAY_NAMES } from "../../utils/constants.jsx";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";
import { useUser } from "../Providers/useUser.tsx";
import { authService } from "../../services/authService.jsx";

export default function AreYouSureEditYourLanguage() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { clearEditProfile, updateProfileSuccess, setCancelProfileEditing } =
    userProfileDispatch(dispatch);

  const pageContentJson = getPageContent(
    language,
    PAGES.areYouSureEditYourLanguage,
  );
  const navigateHelper = useNavigateHelper();

  const backToProfile = path(PAGES.ProfileHome, { language: language });
  const successPage = path(PAGES.profileYouMayUpdateLanguage, {
    language: language,
  });

  const { handleCancel } = useCancelLanguageEditing(backToProfile);

  const selectedLanguage = state?.editProfile?.preferredLanguage || "";

  const saveUpdatedProfileData = async () => {
    try {
      const response = await authService.update_my_user_profile(
        state.editProfile,
      );
      if (response) {
        clearEditProfile();
        updateProfileSuccess(response.data);
        return true;
      } else {
        // Todo: handle errors
      }
    } catch (err) {
      // Todo: handle errors
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      // reset the cancel profile editing state when component unmounts
      setCancelProfileEditing(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
      <GcdsText>
        {pageContentJson["2"]}{" "}
        <strong>{LANGUAGE_DISPLAY_NAMES[language][selectedLanguage]}</strong>.
      </GcdsText>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <ul>
        <li>{pageContentJson["5"]}</li>
        <li>{pageContentJson["10"]}</li>
      </ul>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          onGcdsClick={async (ev) => {
            ev.preventDefault();
            const success = await saveUpdatedProfileData();
            if (success) {
              navigateHelper(successPage);
            }
          }}
        >
          {pageContentJson["8"]}
        </GcdsButton>
        <GcdsButton buttonRole="secondary" onGcdsClick={handleCancel}>
          {pageContentJson["9"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
