import { useState } from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsButton,
  GcdsGrid,
  GcdsRadios,
} from "@cdssnc/gcds-components-react";

import { useParams, useNavigate } from "react-router";

import {
  getPageContent,
  convertLanguageToLanguageCode,
} from "../../../utils/functions.jsx";

import { PAGES, PROFILE_LANGUAGES } from "../../../utils/constants.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { useUser } from "../../../components/Providers/useUser.tsx";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection.jsx";

export default function EditLanguagePreferences() {
  const { language } = useParams();
  const navigate = useNavigate();

  const { state } = useUser();
  const { userProfile } = state;
  const profilePreferredLanguage = userProfile?.preferredLanguage;

  const [updatedLanguage, setUpdatedLanguage] = useState({
    updatedPreferredLanguage: profilePreferredLanguage,
    languageCode: language,
  });

  const backToProfile = path(PAGES.ProfileHome, { language: language });
  const confirmLanguageUpdate = path(PAGES.confirmLanguageUpdate, {
    language: language,
  });

  const pageContentJson = getPageContent(
    updatedLanguage.languageCode,
    PAGES.editLanguagePreferences,
  );

  const englistSelection = {
    label: pageContentJson["13"],
    id: PROFILE_LANGUAGES.en,
    value: PROFILE_LANGUAGES.en,
    checked: profilePreferredLanguage === PROFILE_LANGUAGES.en,
  };
  const frenchSelection = {
    label: pageContentJson["14"],
    id: PROFILE_LANGUAGES.fr,
    value: PROFILE_LANGUAGES.fr,
    checked: profilePreferredLanguage === PROFILE_LANGUAGES.fr,
  };

  const languageOptions = [englistSelection, frenchSelection];

  const handleProfileChange = (e) => {
    const { value } = e.target;
    const languageCode = convertLanguageToLanguageCode(value);
    const data = {
      updatedPreferredLanguage: value,
      languageCode: languageCode,
    };
    setUpdatedLanguage(data);
  };

  const onSubmitHandler = (event) => {
    event.preventDefault();
    navigate(confirmLanguageUpdate, {
      state: { updatedLanguage: updatedLanguage },
    });
  };

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
      <GcdsText>{pageContentJson["2"]}</GcdsText>

      <GcdsGrid columns="1fr">
        <ServicesWithAccessInfoSection
          currentLang={updatedLanguage.languageCode}
        />
      </GcdsGrid>

      <GcdsContainer marginTop="100">
        <GcdsRadios
          name="radio"
          legend={pageContentJson["3"]}
          options={languageOptions}
          lang={updatedLanguage.languageCode}
          onChange={handleProfileChange}
        ></GcdsRadios>
      </GcdsContainer>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          onGcdsClick={(ev) => {
            ev.preventDefault();
            onSubmitHandler(ev);
          }}
        >
          {pageContentJson["15"]}
        </GcdsButton>

        <GcdsButton
          buttonRole="secondary"
          onGcdsClick={(ev) => {
            ev.preventDefault();
            navigate(backToProfile);
          }}
        >
          {pageContentJson["16"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
