import React from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsDetails,
  GcdsLink,
  GcdsButton,
  GcdsGrid,
} from "@cdssnc/gcds-components-react";
import PhoneInput from "react-phone-input-2";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import { useParams } from "react-router";
import SubmitButton from "../Layout/SubmitButton.jsx";

export default function EnterNewPhoneNumber() {
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.enterNewPhoneNumber);
  return (
    <GcdsContainer>
      <form id="form">
        <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
        <GcdsText>{pageContentJson["2"]}</GcdsText>
        <GcdsDetails detailsTitle={pageContentJson["3"]}>
          <GcdsText>
            {pageContentJson["4"]}
            <ul style={{ margin: 0 }}>
              <li>{pageContentJson["5"]}</li>
            </ul>
          </GcdsText>

          <GcdsText>{pageContentJson["6"]}</GcdsText>
          <GcdsText>
            {pageContentJson["7"]}&nbsp;
            <GcdsLink href="">{pageContentJson["8"]}</GcdsLink>.
          </GcdsText>
        </GcdsDetails>
        <br />
        &nbsp;
        <PhoneInput
          specialLabel={pageContentJson["10"]}
          country={"ca"}
          className={"high-res"}
          enableSearch={true}
          countryCodeEditable={false}
          disableSearchIcon={false}
        />
        <br />
        &nbsp;
        <GcdsDetails detailsTitle={pageContentJson["11"]}>
          <GcdsText>{pageContentJson["12"]}</GcdsText>
        </GcdsDetails>
        <br />
        &nbsp;
        <GcdsGrid
          columns="repeat(auto-fit, minmax(100px, 100px))"
          gap="10px"
          align-items="center"
        >
          <SubmitButton style={{ width: "fit-content" }}>
            {pageContentJson["13"]}
          </SubmitButton>
          <GcdsButton buttonRole="secondary" style={{ width: "fit-content" }}>
            {pageContentJson["14"]}
          </GcdsButton>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}
