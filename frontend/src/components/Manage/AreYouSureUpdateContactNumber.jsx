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

export default function AreYouSureUpdateContactNumber() {
  const { language } = useParams();
  const pageContentJson = getPageContent(
    language,
    PAGES.areYouSureUpdateContactNumber,
  );
  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
      <GcdsText>
        {pageContentJson["2"]} <br />
        <strong>{pageContentJson["3"]}</strong>
      </GcdsText>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <ul>
        <li>{pageContentJson["5"]}</li>
      </ul>
      <GcdsNotice type="info" noticeTitleTag="h2" noticeTitle=" ">
        <GcdsText>
          {pageContentJson["6"]} <strong>{pageContentJson["7"]}</strong>{" "}
          {pageContentJson["8"]}{" "}
          <GcdsLink href="#">{pageContentJson[9]}</GcdsLink>
        </GcdsText>
      </GcdsNotice>
      <br />
      <GcdsButton>{pageContentJson["10"]}</GcdsButton>
      &nbsp;
      <GcdsButton buttonRole="secondary">{pageContentJson["11"]}</GcdsButton>
    </GcdsContainer>
  );
}
