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
import { PAGES, NAVIGATION_LINKS } from "../../utils/constants";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";
import { useUser } from "../Providers/useUser";

export default function AreYouSureEditYourName() {
  const { language } = useParams();
  const { state } = useUser();

  const pageContentJson = getPageContent(language, PAGES.areYouSureEditYourName);
  const navigateHelper = useNavigateHelper();
  const backtoProfile = `/${language}${NAVIGATION_LINKS.profileHome}`;
  const username = state?.editProfile?.name.formatted || "";

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
        <GcdsButton>
          {pageContentJson["8"]}
        </GcdsButton>
        <GcdsButton buttonRole="secondary" onGcdsClick={(ev) => {
          ev.preventDefault();
          navigateHelper(backtoProfile)
        }}>
          {pageContentJson["9"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
