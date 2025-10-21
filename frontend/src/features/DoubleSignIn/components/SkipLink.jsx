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

  const [serverErrorMessage, setServerErrorMessage] = useState("");

  const pageContentJson = getPageContent(language, PAGES.password);
  const errorPageJson = getPageContent(language, PAGES.error);

  const configRef = useRef(null);

  useEffect(() => {
    var clientId = "";

    async function getRPAuthUrl() {
      configRef.current.rpAuthUrl =
        await updateLinkStateAPI.getRPAuthUrl(clientId);
    }

    getRPAuthUrl();
  }, []);

  const skipLinking = async () => {
    try {
      console.log("info", "clicked skip linking");

      await updateLinkStateAPI.postSkipLinking(1);

      window.open(configRef.current.rpAuthUrl);

      //return to RP
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
        Are you sure you want to skip linking?
        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            buttonRole="primary"
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              skipLinking();
            }}
          >
            Continue
          </GcdsButton>
        </GcdsGrid>
      </GcdsContainer>
    </GcdsContainer>
  );
}
