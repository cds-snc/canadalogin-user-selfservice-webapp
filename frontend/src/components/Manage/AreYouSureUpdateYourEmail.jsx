import React from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsGrid,
  GcdsButton
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import { useParams } from "react-router";

export default function AreYouSureUpdateYourEmail() {
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.areYouSureUpdateYourEmail);
  return (
      <GcdsContainer>
          <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
          <GcdsText>
              {pageContentJson["2"]} <strong>test.user@gmail.com</strong>.
          </GcdsText>
          <GcdsText>{pageContentJson["3"]}</GcdsText>
          <ul>
              <li>{pageContentJson["4"]}</li>
          </ul>
          <br /> &nbsp;
          <GcdsGrid columns="auto auto" gap="1rem" align-items="center">
              <GcdsButton>
                  {pageContentJson["5"]}
              </GcdsButton>
              <GcdsButton buttonRole="secondary">
                  {pageContentJson["6"]}
              </GcdsButton>
          </GcdsGrid>
      </GcdsContainer>
  );
}
