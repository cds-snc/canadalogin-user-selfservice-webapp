import React from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
  GcdsLink,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import { useParams } from "react-router";

export default function YouMayUpdateEmailAtOtherPlaces() {
  const { language } = useParams();
  const pageContentJson = getPageContent(
    language,
    PAGES.youMayUpdateEmailAtOtherPlaces,
  );

  return (
    <GcdsContainer>
      <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=" ">
        <GcdsText>{pageContentJson["1"]} test.user@gmail.com</GcdsText>
      </GcdsNotice>
      <br />
      &nbsp;
      <GcdsHeading tag="h1">{pageContentJson["2"]}</GcdsHeading>
      <GcdsHeading tag="h3">{pageContentJson["3"]}</GcdsHeading>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <GcdsText>
        {pageContentJson["5"]}{" "}
        <GcdsLink href="#">{pageContentJson["6"]}</GcdsLink>
      </GcdsText>
      <GcdsGrid columns="auto auto" gap="1rem" align-items="center">
        <GcdsButton style={{ width: "fit-content" }}>
          {pageContentJson["7"]}
        </GcdsButton>
        &nbsp;
        <GcdsButton buttonRole="secondary" style={{ width: "fit-content" }}>
          {pageContentJson["8"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
