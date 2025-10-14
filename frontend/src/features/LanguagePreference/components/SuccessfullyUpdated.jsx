import React, { useEffect } from "react";
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

export default function SuccessfullyUpdatedLanguage() {
  const { language } = useParams();
  const { state } = useUser();
  const pageContentJson = getPageContent(
    language,
    PAGES.successfullyUpdatedLanguage,
  );
  const backToProfile = path(PAGES.ProfileHome, { language: language });
  const location = useLocation();
  const navigate = useNavigate();
  const { updatedLanguage } = location.state ?? {};
  const preferredLanguage = state?.userProfile?.preferredLanguage || "";
  const editLanguagePreferences = path(PAGES.editLanguagePreferences, {
    language: language,
  });
  useEffect(() => {
    if (!updatedLanguage) navigate(editLanguagePreferences);
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
            navigate(backToProfile);
          }}
        >
          {pageContentJson["7"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
