import { useState, useEffect, useRef } from "react";
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
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";
import { path } from "../../../utils/routeHelpers.js";

export default function LinkPrompt() {
  const { language } = useParams();

  const [serverErrorMessage, setServerErrorMessage] = useState("");

  const pageContentJson = getPageContent(language, PAGES.password);
  const errorPageJson = getPageContent(language, PAGES.error);

  const configRef = useRef(null);

  useEffect(() => {
    async function loadClientDetails() {
      configRef.current.clientId = "12341";
      configRef.current.legacyIDPUrl =
        "https://www.google.ca/" + configRef.current.clientId;
    }

    loadClientDetails();
  }, []);

  const toLinkSucessPage = path(PAGES.LinkSuccess, {
    language: language,
  });

  const toSkipLinkPage = path(PAGES.SkipLink, {
    language: language,
  });

  const navigateHelper = useNavigateHelper();

  const startLinking = async () => {
    try {
      console.log("info", "clicked start linking");
      navigateHelper(toLinkSucessPage);
    } catch (err) {
      if (err && err.data && err.data.message) {
        setServerErrorMessage(err.data.message);
      }
      console.log("err", err);
    }
  };

  const skipLinking = async () => {
    try {
      console.log("info", "clicked skip linking");
      navigateHelper(toSkipLinkPage);
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
      <GcdsText>{errorMessage}</GcdsText>
      <section>
        <gcds-text>
          <gcds-icon name="checkmark-circle"></gcds-icon>
          Completed: Use the new sign-in method
        </gcds-text>
        <gcds-text>
          <strong>
            Your Canada Dental Care Plan Account is still linked to your bank or
            GCKey.
          </strong>{" "}
          To keep your account, you’ll need to sign in with your old method one
          last time.
        </gcds-text>
        <div class="pb-300">
          <gcds-link href="#" external>
            More information about account migration
          </gcds-link>
        </div>
        <gcds-text>
          Use the sign-in method you used the last time you signed into this
          service.
        </gcds-text>
        <div class="pb-300">
          <GcdsButton
            buttonRole="primary"
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              startLinking();
            }}
          >
            Sign in with your bank or GCKey
          </GcdsButton>
        </div>
      </section>
      <gcds-details details-title="Learn more about this topic">
        If you’ve completed this step on another online service,you’ll need to
        do it again so we can link your account for this service.
      </gcds-details>
      <section>
        <gcds-heading tag="h2">
          First time on Canada Dental Care Plan Account?
        </gcds-heading>
        <gcds-text>
          If you have not signed in to this portal with your bank or GCKey in
          the past, you can skip this step.
        </gcds-text>
        <gcds-link
          href="#"
          onGcdsClick={(ev) => {
            ev.preventDefault();
            skipLinking();
          }}
        >
          Skip linking my account
        </gcds-link>
      </section>
    </GcdsContainer>
  );
}
