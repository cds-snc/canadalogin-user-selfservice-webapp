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

import { PAGES } from "../../../utils/constants.jsx";
import { useParams } from "react-router";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";

import { updateLinkStateAPI } from "../api/UpdateLinkState.jsx";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";
export default function LinkSuccess() {
  const { language } = useParams();

  const [serverErrorMessage, setServerErrorMessage] = useState("");

  const pageContentJson = getPageContent(language, PAGES.password);
  const errorPageJson = getPageContent(language, PAGES.error);

  const configRef = useRef(null);

  const navigateHelper = useNavigateHelper();

  useEffect(() => {
    var clientId = "";

    async function getRPAuthUrl() {
      configRef.current.rpAuthUrl =
        await updateLinkStateAPI.rpAuthUrl(clientId);
    }

    getRPAuthUrl();
  }, []);

  const continueToRP = async () => {
    try {
      console.log("info", "clicked start linking");
      navigateHelper(configRef.current.rpAuthUrl);
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
        <gcds-heading tag="h1">
          Your sign-in method has been updated
        </gcds-heading>
        <gcds-text>
          You can now use GC Sign in to access your Canada Dental Care Plan
          Account.
        </gcds-text>
        <gcds-text>
          If you use your bank or GCKey to access other accounts, you will need
          to complete this process for each one.
        </gcds-text>
        <GcdsButton
          buttonRole="primary"
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            continueToRP();
          }}
        >
          Finish
        </GcdsButton>
      </section>
    </GcdsContainer>
  );
}
