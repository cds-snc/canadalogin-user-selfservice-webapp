import { useEffect, useState, useRef } from "react";
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

import { updateLinkStateAPI } from "../api/UpdateLinkState.jsx";
import { PAGES } from "../../../utils/constants.jsx";
import { useParams } from "react-router";

export default function SkipLink() {
  const { language } = useParams();
  const { submit } = getPageContent(language, "Button");

  const [serverErrorMessage, setServerErrorMessage] = useState("");

  const pageContentJson = getPageContent(language, PAGES.password);
  const errorPageJson = getPageContent(language, PAGES.error);

  const configRef = useRef(null);

  useEffect(() => {
    async function submitSkipLinking() {
      await updateLinkStateAPI.getRPAuthUrl(1);
    }
    async function loadClientDetails() {
      configRef.current.clientId = "12341";
      configRef.current.legacyIDPUrl =
        "https://www.google.ca/" + configRef.current.clientId;
    }

    loadClientDetails();
    submitSkipLinking();
  }, []);

  const startLinking = async () => {
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
      <GcdsText>Skip Link</GcdsText>
      <GcdsText>{errorMessage}</GcdsText>
      <GcdsContainer>
        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            buttonRole="primary"
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              startLinking();
            }}
          >
            {submit}
          </GcdsButton>
        </GcdsGrid>
      </GcdsContainer>
    </GcdsContainer>
  );
}
