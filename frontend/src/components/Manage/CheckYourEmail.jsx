import React from "react";
import { useParams } from "react-router";
import { getPageContent } from "../../utils/functions.jsx";
import { PAGES } from "../../utils/constants.jsx";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsLink,
  GcdsInput,
  GcdsButton,
} from "@cdssnc/gcds-components-react";
import SubmitButton from "../Layout/SubmitButton.jsx";

export default function CheckYourEmail() {
  const { language } = useParams();
  const pageContent = getPageContent(language, PAGES.CheckYourEmail);

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContent["1"]}</GcdsHeading>
      <GcdsText>
        {pageContent["2"]} <strong>{pageContent["3"]}</strong>
      </GcdsText>
      <GcdsText>{pageContent["4"]}</GcdsText>
      <GcdsText>
        {pageContent["5"]} <strong>{pageContent["6"]}</strong>
      </GcdsText>
      <form id="form">
        <GcdsInput
          inputId="verificationCode"
          label={pageContent["7"]}
          name="verificationCode"
          type="text"
          validateOn="other"
        />
        <GcdsGrid
          columns="repeat(auto-fit, minmax(100px, 100px))"
          gap="10px"
          align-items="center"
        >
          <SubmitButton buttonRole="primary">{pageContent["8"]}</SubmitButton>
          <GcdsButton buttonRole="secondary">{pageContent["9"]}</GcdsButton>
        </GcdsGrid>
      </form>
      <GcdsHeading tag="h2">{pageContent["10"]}</GcdsHeading>
      <GcdsLink href="#">{pageContent["11"]}</GcdsLink>
      <br />
      &nbsp;
      <GcdsText>
        {pageContent["12"]} <strong>{pageContent["13"]}</strong>
      </GcdsText>
    </GcdsContainer>
  );
}
