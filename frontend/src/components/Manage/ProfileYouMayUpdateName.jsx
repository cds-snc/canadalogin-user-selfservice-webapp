import React from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton, GcdsGrid, GcdsLink
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import { useParams } from "react-router";

export default function ProfileYouMayUpdateName() {
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.profileYouMayUpdateName);

  return (
    <GcdsContainer>
      <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=' '>
        <GcdsText>
          <strong>{pageContentJson["1"]}</strong>
        </GcdsText>
      </GcdsNotice>
      <GcdsHeading tag="h1">{pageContentJson["2"]}</GcdsHeading>
      <GcdsHeading tag="h4">{pageContentJson["3"]}</GcdsHeading>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <GcdsText>{pageContentJson["5"]} <GcdsLink href="#" >{pageContentJson["8"]}</GcdsLink></GcdsText>
      <GcdsText>{pageContentJson["9"]} <GcdsLink href="#" >{pageContentJson["10"]}</GcdsLink>{pageContentJson["11"]}</GcdsText>

      <GcdsGrid columns="auto auto" gap="1rem" align-items="center">
        <GcdsButton style={{ width: 'fit-content' }}>
          {pageContentJson["6"]}
        </GcdsButton>&nbsp;
        <GcdsButton buttonRole="secondary" style={{ width: 'fit-content' }}>
          {pageContentJson["7"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
