import React from "react";
import { useParams } from "react-router";
import { getPageContent } from "../../utils/functions.jsx";
import { PAGES } from "../../utils/constants.jsx";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsDetails,
  GcdsText,
  GcdsLink,
  GcdsGrid,
  GcdsInput,
  GcdsButton,
} from "@cdssnc/gcds-components-react";
import SubmitButton from "../Layout/SubmitButton.jsx";

export default function EnterNewEmail() {
  const { language } = useParams();
  const pageContent = getPageContent(language, PAGES.EnterNewEmail);

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContent["1"]}</GcdsHeading>
      <GcdsText>
        <span>{pageContent["2"]}</span>
        <ul style={{ margin: 0 }}>
          <li>{pageContent["3"]}</li>
          <li>{pageContent["4"]}</li>
          <li>{pageContent["5"]}</li>
        </ul>
      </GcdsText>
      <GcdsDetails detailsTitle={pageContent["6"]}>
        <GcdsText>
          <span>{pageContent["7"]}</span>
          <ul style={{ margin: 0 }}>
            <li>{pageContent["8"]}</li>
          </ul>
        </GcdsText>
        <GcdsText>{pageContent["9"]}</GcdsText>
        <GcdsText>
          <span>{pageContent["10"]} </span>
          <GcdsLink href="#"> {pageContent["11"]}</GcdsLink>
        </GcdsText>
      </GcdsDetails>
      <form id="form">
        <GcdsInput
          inputId="EmailId"
          label={pageContent["12"]}
          name="EmailId"
          type="text"
          validateOn="other"
        ></GcdsInput>
        <GcdsGrid
          columns="repeat(auto-fit, minmax(100px, 100px))"
          gap="10px"
          align-items="center"
        >
          <SubmitButton>{pageContent["13"]}</SubmitButton>
          <GcdsButton buttonRole="secondary">{pageContent["14"]}</GcdsButton>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}
