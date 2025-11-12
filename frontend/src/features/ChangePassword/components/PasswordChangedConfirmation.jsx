import { useState, useEffect } from "react";
import { useParams } from "react-router";

import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";

export default function PasswordChangedConfirmation() {
  const { language } = useParams();
  const [time, setTime] = useState(5);
  const pageContentJson = getPageContent(
    language,
    PAGES.passwordChangedConfirmation,
  );

  const redirectToHomepage = () => {
    return (window.location.href = "/");
  };

  useEffect(() => {
    if (time <= 0) return;

    const timer = setTimeout(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time]);

  useEffect(() => {
    if (time <= 0) {
      redirectToHomepage();
      return;
    }
  }, [time]);

  return (
    <GcdsContainer>
      <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=" ">
        <GcdsText>{pageContentJson["1"]}</GcdsText>
      </GcdsNotice>
      <br />
      &nbsp;
      <GcdsHeading tag="h1">{pageContentJson["2"]}</GcdsHeading>
      <GcdsText>{pageContentJson["3"]}</GcdsText>
      <GcdsGrid columns="auto auto" gap="1rem" align-items="center">
        <GcdsButton
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            redirectToHomepage();
          }}
        >
          {pageContentJson["4"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
