import { useState, useEffect } from "react";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";
import { getPageContent } from "../../../utils/functions.jsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { PAGES } from "../../../utils/constants.jsx";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";
import { useUser } from "../../../components/Providers/useUser.tsx";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection.jsx";

export default function ProfileUpdateName() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const pageNameEditJson = getPageContent(language, PAGES.profileUpdateName);
  const navigateHelper = useNavigateHelper();
  const { cloneUserProfile, updateClonedProfile } =
    userProfileDispatch(dispatch);
  const [editProfile, setEditProfile] = useState({ ...state.editProfile });

  const confirmation = path(PAGES.profileUpdateNameConfirmUpdate, {
    language: language,
  });
  const backToProfile = path(PAGES.ProfileHome, { language: language });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setEditProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const useSubmitHandler = (event) => {
    event.preventDefault();
    const updatedName = {
      givenName: editProfile.givenName,
      familyName: editProfile.familyName,
      formatted: `${editProfile.givenName} ${editProfile.familyName}`,
    };
    updateClonedProfile({ name: updatedName });
    navigateHelper(confirmation);
  };

  useEffect(() => {
    cloneUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageNameEditJson["5"]}</GcdsHeading>

      <GcdsText>
        {pageNameEditJson["6"]} <strong>{pageNameEditJson["7"]}</strong>
      </GcdsText>

      <ServicesWithAccessInfoSection currentLang={language} />

      <form id="form" style={{ marginTop: "38px" }} onSubmit={useSubmitHandler}>
        <GcdsContainer marginTop="100" marginBottom="0">
          <GcdsInput
            inputId="givenName"
            label={pageNameEditJson["2"]}
            name="givenName"
            type="text"
            validateOn="other"
            data-testid="givenName"
            lang={language}
            onChange={handleProfileChange}
          />
          <GcdsInput
            inputId="familyName"
            label={pageNameEditJson["3"]}
            name="familyName"
            type="text"
            validateOn="other"
            data-testid="familyName"
            lang={language}
            required
            onChange={handleProfileChange}
          />
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            currentLang={language}
            disabled={false}
            onGcdsClick={useSubmitHandler}
          />
          <GcdsButton
            buttonRole="secondary"
            onGcdsClick={(ev) => {
              console.log(ev);
              ev.preventDefault();
              navigateHelper(backToProfile);
            }}
          >
            {pageNameEditJson["4"]}
          </GcdsButton>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}
