import React, { useEffect, useState } from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
  GcdsErrorMessage,
} from "@cdssnc/gcds-components-react";
import { useParams, useLocation, useNavigate } from "react-router";

import { getPageContent } from "../../../utils/functions.jsx";
import { PAGES } from "../../../utils/constants.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { authService } from "../../../services/authService.jsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";
import Loader from "../../../components/Layout/Loading";

const ErrorMessage = ({ errorMessage }) => {
  return (
    <>
      {errorMessage && (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      )}
    </>
  );
};

export default function ConfirmNameUpdated() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const navigate = useNavigate();
  const [errorCode, setErrorCode] = useState("");

  const { updateProfileSuccess } = userProfileDispatch(dispatch);
  const [localLoading, setLocalLoading] = useState(false);

  const pageContentJson = getPageContent(
    language,
    PAGES.profileUpdateNameConfirmUpdate,
  );
  const loaderPageContentJson = getPageContent(language, PAGES.otpSelection);
  const errorPageJson = getPageContent(language, PAGES.error);

  const location = useLocation();
  // state comes from the navigate call in UpdateProfileName.jsx
  // If user directly navigates directly to this page, there will be no state and will redirected back to edit page
  const [savedLocationState, setSavedLocationState] = useState(null);
  const name = savedLocationState?.name;

  const formattedName = name?.formatted;

  const successPage = path(PAGES.profileUpdateNameSuccess, {
    language: language,
  });
  const backToProfile = path(PAGES.ProfileHome, { language: language });
  const editProfile = path(PAGES.profileUpdateName, { language: language });

  useEffect(() => {
    if (location?.state?.name) {
      // save location state to local state, when the language is toggled the location.state is null
      setSavedLocationState(location.state);
    } else {
      // redirect to edit page if no name data
      navigate(editProfile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let errorMessage = errorPageJson[errorCode] || "";
  if (errorCode && errorMessage === "") {
    errorMessage = errorCode;
  }

  const saveUpdatedProfileData = async () => {
    try {
      setLocalLoading(true);
      const response = await authService.update_my_user_profile({
        name: name,
        userId: state.userProfile.id,
      });
      updateProfileSuccess(response.data);
      navigate(successPage, { state: { name: name } });
    } catch (err) {
      console.log(err.data.message);
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  if (!name?.formatted) return null;

  return localLoading ? (
    <Loader text={loaderPageContentJson["11"]} />
  ) : (
    <>
      <ErrorMessage errorMessage={errorMessage} />
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
    </>
  );
}
