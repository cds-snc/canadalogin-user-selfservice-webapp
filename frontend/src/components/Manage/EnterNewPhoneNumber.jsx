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

export default function EnterNewPhoneNumber() {
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.enterNewPhoneNumber);
  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
    </GcdsContainer>
  );
}
