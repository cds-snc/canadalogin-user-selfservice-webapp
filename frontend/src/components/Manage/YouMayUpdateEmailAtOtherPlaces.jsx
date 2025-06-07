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

export default function YouMayUpdateEmailAtOtherPlaces() {
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.youMayUpdateEmailAtOtherPlaces);

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
    </GcdsContainer>
  );
}
