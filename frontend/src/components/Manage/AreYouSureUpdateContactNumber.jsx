import React from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton, GcdsGrid,
  GcdsLink
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import { useParams } from "react-router";

export default function AreYouSureUpdateContactNumber() {
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.areYouSureUpdateContactNumber);
  return (
      <GcdsContainer>
          <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
          <GcdsText>
              You’ve requested to update your contact phone number to: <br />
              <strong>+1 (594) 050 - 2039.</strong>
          </GcdsText>
              <GcdsText>
                  This will update your contact phone number with the following services:
              </GcdsText>
              <ul>
                  <li>GEO.ca</li>
              </ul>

              <GcdsNotice type="info" noticeTitleTag="h2" noticeTitle=' '>
                  <GcdsText>
                    This only changes your <strong>contact phone number.</strong> To change your 2-step verification number, go to your <GcdsLink href="#">security settings.</GcdsLink> 
                  </GcdsText>
              </GcdsNotice>
              <br/>
                  <GcdsButton>
                      Yes, update
                  </GcdsButton>
                &nbsp;
                  <GcdsButton buttonRole="secondary" >
                      Cancel
                  </GcdsButton>
    </GcdsContainer>
  );
}
