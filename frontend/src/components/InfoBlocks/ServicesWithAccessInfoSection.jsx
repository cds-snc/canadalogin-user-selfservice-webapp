import { GcdsDetails, GcdsText, GcdsLink } from "@cdssnc/gcds-components-react";
import {
  getContentWithVariables,
  getPageContent,
} from "../../utils/functions.jsx";
import { EXTERNAL_NAVIGATION_LINKS, PAGES } from "../../utils/constants.jsx";
import { useUser } from "../Providers/useUser.js";

export default function ServicesWithAccessInfoSection({
  currentLang,
  information,
}) {
  const pageContentJson = getPageContent(
    currentLang,
    PAGES.ServicesWithAccessInfo,
  );
  const informationMap = {
    name: pageContentJson["7"],
    contactPhoneNumber: pageContentJson["8"],
    languagePreference: pageContentJson["9"],
  };
  const { state } = useUser();

  const rp = state.relyingPartyInfo
    ? {
        name: state.relyingPartyInfo.linkName,
        url: state.relyingPartyInfo.url,
      }
    : null;
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
        <li>{rp?.name ?? pageContentJson["3"]}</li>
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
