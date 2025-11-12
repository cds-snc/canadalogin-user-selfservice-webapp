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
} from "@cdssnc/gcds-components-react";
import SubmitButton from "../Layout/SubmitButton.jsx";

export default function FirstVerifyItsYou() {
  const { language } = useParams();
  const pageContent = getPageContent(language, PAGES.FirstVerifyItsYou);

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContent["1"]}</GcdsHeading>
      <GcdsText>{pageContent["2"]} </GcdsText>
      <form id="form">
        <GcdsInput
          inputId="input-password"
          label={pageContent["3"]}
          name="password"
        ></GcdsInput>
        <GcdsGrid
          columns="repeat(auto-fit, minmax(100px, 100px))"
          gap="10px"
          align-items="center"
        >
          <SubmitButton buttonRole="primary" style={{ width: "fit-content" }}>
            {pageContent["4"]}
          </SubmitButton>
          <GcdsButton buttonRole="secondary" style={{ width: "fit-content" }}>
            {pageContent["5"]}
          </GcdsButton>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}
