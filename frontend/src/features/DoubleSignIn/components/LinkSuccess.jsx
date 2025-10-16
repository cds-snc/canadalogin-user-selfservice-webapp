import { useState } from "react";
import {
  GcdsContainer,
  GcdsText,
  GcdsDetails,
  GcdsInput,
  GcdsStepper,
  GcdsLink,
  GcdsCheckboxes,
  GcdsGrid,
  GcdsButton,
  GcdsHeading,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions.jsx";

import { PAGES } from "../../../utils/constants.jsx";
import { useParams } from "react-router";

import { updateLinkStateAPI } from "../api/UpdateLinkState.jsx";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";
export default function LinkSuccess() {
  const { language } = useParams();
  const { submit } = getPageContent(language, "Button");

  const [serverErrorMessage, setServerErrorMessage] = useState("");

  const pageContentJson = getPageContent(language, PAGES.password);
  const errorPageJson = getPageContent(language, PAGES.error);

  async function submitLegacyPAI() {
    await updateLinkStateAPI.submitLegacyPAI(1);
  }

  submitLegacyPAI();

  const continueToRP = async () => {
    try {
      console.log("info", "clicked start linking");
    } catch (err) {
      if (err && err.data && err.data.message) {
        setServerErrorMessage(err.data.message);
      }
      console.log("err", err);
    }
  };

  const errorMessage = errorPageJson[serverErrorMessage] || "";

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1" lang={language}>
        {pageContentJson["14"]}
      </GcdsHeading>

      <GcdsText>Link Success</GcdsText>
      <GcdsText>{errorMessage}</GcdsText>
      <GcdsContainer>
        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            buttonRole="primary"
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              continueToRP();
            }}
          >
            {submit}
          </GcdsButton>
        </GcdsGrid>
      </GcdsContainer>
    </GcdsContainer>
  );
}
