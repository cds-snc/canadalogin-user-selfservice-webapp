import React, { useEffect } from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
} from "@cdssnc/gcds-components-react";
import { useParams, useLocation, useNavigate } from "react-router";

import { getPageContent } from "../../../utils/functions.jsx";
import { PAGES } from "../../../utils/constants.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { authService } from "../../../services/authService.jsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";

export default function ConfirmNameUpdated() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const navigate = useNavigate();

  const { updateProfileSuccess } = userProfileDispatch(dispatch);
  const pageContentJson = getPageContent(
    language,
    PAGES.profileUpdateNameConfirmUpdate,
  );
  const location = useLocation();
  // state comes from the navigate call in UpdateProfileName.jsx
  // If user directly navigates directly to this page, there will be no state and will redirected back to edit page
  const { name } = location.state ?? {};
  const formattedName = name?.formatted;

  const successPage = path(PAGES.profileUpdateNameSuccess, {
    language: language,
  });
  const backToProfile = path(PAGES.ProfileHome, { language: language });
  const editProfile = path(PAGES.profileUpdateName, { language: language });

  useEffect(() => {
    // If no name data, redirect to edit page
    if (!name) navigate(editProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveUpdatedProfileData = async () => {
    try {
      const response = await authService.update_my_user_profile({
        name: name,
        userName: state.userProfile.userName,
      });
      if (response) {
        updateProfileSuccess(response.data);
        navigate(successPage, { state: { name: name } });
      } else {
        // Todo: handle errors
        console.error(response);
      }
    } catch (err) {
      // Todo: handle errors
      console.error(err);
    }
  };

  return (
    <GcdsContainer>
      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
        <div>
          <GcdsText marginBottom="0">
            {pageContentJson["2"]} <strong>{formattedName}</strong>.
          </GcdsText>
          <GcdsText marginBottom="0">{pageContentJson["4"]}</GcdsText>
          <ul>
            <li>{pageContentJson["5"]}</li>
            <li>{pageContentJson["10"]}</li>
          </ul>
        </div>

        <GcdsNotice type="info" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            {pageContentJson["7"]} <strong>{pageContentJson["11"]}</strong>{" "}
            {pageContentJson["12"]}
          </GcdsText>
        </GcdsNotice>
        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            onGcdsClick={async (ev) => {
              ev.preventDefault();
              await saveUpdatedProfileData();
            }}
          >
            {pageContentJson["8"]}
          </GcdsButton>
          <GcdsButton
            buttonRole="secondary"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              navigate(backToProfile);
            }}
          >
            {pageContentJson["9"]}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
