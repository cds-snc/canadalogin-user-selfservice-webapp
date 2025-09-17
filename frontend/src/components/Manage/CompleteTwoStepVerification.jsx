import React from "react";
import { useParams } from "react-router";
import { getPageContent } from "../../utils/functions.jsx";
import { PAGES } from "../../utils/constants.jsx";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsInput,
  GcdsButton,
  GcdsLink,
} from "@cdssnc/gcds-components-react";
import SubmitButton from "../Layout/SubmitButton.jsx";

export default function CompleteTwoStepVerification() {
  const { language } = useParams();
  const pageContent = getPageContent(
    language,
    PAGES.CompleteTwoStepVerification,
  );

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContent["1"]}</GcdsHeading>
      <GcdsText>
        {pageContent["2"]} <strong>{pageContent["3"]}</strong>
      </GcdsText>
      <GcdsLink href="#">{pageContent["4"]}</GcdsLink>
      <br></br>&nbsp;
      <form id="form">
        <GcdsInput
          inputId="verificationCode"
          label={pageContent["5"]}
          name="verificationCode"
          type="text"
          validateOn="other"
        ></GcdsInput>
        <GcdsGrid
          columns="repeat(auto-fit, minmax(100px, 100px))"
          gap="10px"
          align-items="center"
        >
          <SubmitButton>{pageContent["6"]}</SubmitButton>
          <GcdsButton buttonRole="secondary">{pageContent["7"]}</GcdsButton>
        </GcdsGrid>
      </form>
      <GcdsHeading tag="h2">{pageContent["8"]}</GcdsHeading>
      <GcdsLink href="#">{pageContent["9"]}</GcdsLink>
      <br></br>&nbsp;
      <GcdsText>
        {pageContent["10"]} <strong>{pageContent["11"]}</strong>
      </GcdsText>
    </GcdsContainer>
  );
}
