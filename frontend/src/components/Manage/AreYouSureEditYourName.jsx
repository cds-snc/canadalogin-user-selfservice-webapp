import React from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton, GcdsGrid
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import { useParams } from "react-router";

export default function AreYouSureEditYourName() {
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.areYouSureEditYourName);
  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
      <GcdsText>
        {pageContentJson["2"]} <strong>{pageContentJson["3"]}</strong>.
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
        <GcdsButton buttonRole="secondary">
          {pageContentJson["9"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
