import {
  GcdsDetails,
  GcdsText,
  GcdsLink
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions.jsx";
import { PAGES } from "../../utils/constants.jsx";

export default function ServicesWithAccessInfoSection({ currentLang }) {
  const pageContentJson = getPageContent(currentLang, PAGES.ServicesWithAccessInfo);
  return (
    <GcdsDetails detailsTitle={pageContentJson["1"]}>
      <GcdsText>
        <span>{pageContentJson["2"]}</span>
      </GcdsText>
      <ul style={{ margin: 0 }}>
        <li>{pageContentJson["3"]}</li>
      </ul>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <GcdsText>
        {pageContentJson["5"]}&nbsp;
        <GcdsLink href="https://accounts.gc.ca/directory">
          {pageContentJson["6"]}
        </GcdsLink>
        .
      </GcdsText>
    </GcdsDetails>
  );
}
