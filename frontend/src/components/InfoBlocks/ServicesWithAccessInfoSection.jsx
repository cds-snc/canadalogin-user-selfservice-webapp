import { GcdsDetails, GcdsText, GcdsLink } from "@cdssnc/gcds-components-react";
import { getContentWithVariables, getPageContent } from "../../utils/functions";
import {
  EXTERNAL_NAVIGATION_LINKS,
  PAGES,
  ServicesWithAccessInfoSectionInformation,
} from "../../utils/constants";
import RPNameDisplay from "../RPInfo/RPNameDisplay.jsx";

export default function ServicesWithAccessInfoSection({
  currentLang,
  information,
}) {
  const pageContentJson = getPageContent(
    currentLang,
    PAGES.ServicesWithAccessInfo,
  );
  const informationMap = {
    [ServicesWithAccessInfoSectionInformation.NAME]: pageContentJson["7"],
    [ServicesWithAccessInfoSectionInformation.CONTACT_PHONE_NUMBER]:
      pageContentJson["8"],
    [ServicesWithAccessInfoSectionInformation.LANGUAGE_PREFERENCE]:
      pageContentJson["9"],
    [ServicesWithAccessInfoSectionInformation.EMAIL_ADDRESS]:
      pageContentJson["10"],
  };

  return (
    <GcdsDetails
      detailsTitle={getContentWithVariables(pageContentJson["1"], {
        information: informationMap[information],
      })}
    >
      <GcdsText>
        <span>
          {getContentWithVariables(pageContentJson["2"], {
            information: informationMap[information],
          })}
        </span>
      </GcdsText>
      <ul style={{ margin: 0 }}>
        <li>
          <RPNameDisplay rpName={pageContentJson["3"]} />
        </li>
      </ul>
      <GcdsText>
        {getContentWithVariables(pageContentJson["4"], {
          information: informationMap[information],
        })}
      </GcdsText>
      <GcdsText>
        {pageContentJson["5"]}&nbsp;
        <GcdsLink href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}>
          {pageContentJson["6"]}
        </GcdsLink>
        .
      </GcdsText>
    </GcdsDetails>
  );
}
