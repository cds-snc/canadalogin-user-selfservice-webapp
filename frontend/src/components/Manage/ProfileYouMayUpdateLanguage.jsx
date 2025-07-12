import React from "react";
import { useParams } from "react-router";

import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton, GcdsGrid, GcdsLink
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions.jsx";
import { PAGES, NAVIGATION_LINKS, LANGUAGE_DISPLAY_NAMES } from "../../utils/constants.jsx";
import { useUser } from "../Providers/useUser.tsx";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";


export default function ProfileYouMayUpdateLanguage() {
  const { language } = useParams();
  const { state } = useUser();
  const pageContentJson = getPageContent(language, PAGES.profileYouMayUpdateLanguage);
  const navigateHelper = useNavigateHelper();
  const backtoProfile = `/${language}${NAVIGATION_LINKS.profileHome}`;

  const preferredLanguage = state?.userProfile?.preferredLanguage || "";
  console.log("state", state)
  return (
    <GcdsContainer>
      <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=' '>
        <GcdsText>
          <strong>{pageContentJson["1"]} {LANGUAGE_DISPLAY_NAMES[preferredLanguage]}</strong>
        </GcdsText>
      </GcdsNotice>
      <GcdsHeading tag="h1">{pageContentJson["2"]}</GcdsHeading>
      <GcdsHeading tag="h4">{pageContentJson["3"]}</GcdsHeading>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <GcdsText>{pageContentJson["5"]} <GcdsLink href="#" >{pageContentJson["8"]}</GcdsLink></GcdsText>
      <GcdsText>{pageContentJson["9"]} <GcdsLink href="#" >{pageContentJson["10"]}</GcdsLink>{pageContentJson["11"]}</GcdsText>

      <GcdsGrid columns="auto auto" gap="1rem" align-items="center">
        <GcdsButton style={{ width: 'fit-content' }} onGcdsClick={(ev) => {
          ev.preventDefault();
          navigateHelper(backtoProfile)
        }}>
          {pageContentJson["6"]}
        </GcdsButton>&nbsp;
        <GcdsButton buttonRole="secondary" style={{ width: 'fit-content' }} onGcdsClick={(ev) => {
          ev.preventDefault();
          navigateHelper(backtoProfile)
        }}>
          {pageContentJson["7"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
