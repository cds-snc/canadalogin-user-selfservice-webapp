import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsButton,
  GcdsGrid,
  GcdsErrorMessage,
} from "@cdssnc/gcds-components-react";

import {
  getPageContent,
  convertLanguageToLanguageCode,
} from "../../../utils/functions.jsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { PAGES, LANGUAGE_DISPLAY_NAMES } from "../../../utils/constants.jsx";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { authService } from "../../../services/authService.jsx";
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

export default function ConfirmLanguageUpdate() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const [errorCode, setErrorCode] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { updateProfileSuccess } = userProfileDispatch(dispatch);
  const [localLoading, setLocalLoading] = useState(false);
  const [savedLocationState, setSavedLocationState] = useState(null);
  const updatedLanguage = savedLocationState?.updatedLanguage;

  // if user navigates directly to this page, there will be no updatedLanguage data and will be redirected back to edit page
  // fallback to url param to avoid undefined
  const languageCode = updatedLanguage?.languageCode ?? language;

  const pageContentJson = getPageContent(
    languageCode,
    PAGES.confirmLanguageUpdate,
  );
  const loaderPageContentJson = getPageContent(
    languageCode,
    PAGES.otpSelection,
  );
  const errorPageJson = getPageContent(language, PAGES.error);

  const editLanguagePreferences = path(PAGES.editLanguagePreferences, {
    language: language,
  });
  const backToProfile = path(PAGES.ProfileHome, { language: language });

  const saveUpdatedLanguagePreferences = async () => {
    try {
      setLocalLoading(true);
      const response = await authService.update_my_user_profile({
        preferredLanguage: updatedLanguage.updatedPreferredLanguage,
        userName: state.userProfile.userName,
      });
      updateProfileSuccess(response.data);
      const successPage = path(PAGES.successfullyUpdatedLanguage, {
        language: convertLanguageToLanguageCode(
          response.data.preferredLanguage,
        ),
      });
      navigate(successPage, {
        state: { updatedLanguage: updatedLanguage },
      });
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
      console.error(err);
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    if (location?.state?.updatedLanguage) {
      // save location state to local state, when the language is toggled the location.state is null
      setSavedLocationState(location.state);
    } else {
      // redirect to edit page if no updatedLanguage data
      navigate(editLanguagePreferences);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!updatedLanguage?.languageCode) return null;
  const errorMessage = errorPageJson[errorCode] || "";

  return localLoading ? (
    <Loader text={loaderPageContentJson["11"]} />
  ) : (
    <>
      <ErrorMessage errorMessage={errorMessage} />
      <GcdsContainer>
        <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
        <GcdsText>
          {pageContentJson["2"]}{" "}
          <strong>
            {
              LANGUAGE_DISPLAY_NAMES[updatedLanguage.languageCode][
                updatedLanguage.updatedPreferredLanguage
              ]
            }
          </strong>
          .
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
              await saveUpdatedLanguagePreferences();
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
      </GcdsContainer>
    </>
  );
}
