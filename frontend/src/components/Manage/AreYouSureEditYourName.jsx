// AreYouSureEditYourName.jsx
import React from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import { useParams } from "react-router";

export default function AreYouSureEditYourName() {
    const { language } = useParams();
    const pageContentJson = getPageContent(language, PAGES.areYouSureToUpdateName);

  const page = getPageContent(language, PAGES.areYouSureToUpdateName);

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>

      <GcdsText>
        {page["2"]} <strong>{page["3"]}</strong>.
      </GcdsText>

      <GcdsText>{page["4"]}</GcdsText>
      <ul>
        <li>{page["5"]}</li>
      </ul>

      <GcdsNotice type="info" noticeTitleTag="h2" noticeTitle={page["6"]}>
        <GcdsText>{page["7"]}</GcdsText>
      </GcdsNotice>

      {/* <div style={{ margin: "1rem 0" }}> */}
        <GcdsButton onClick={() => onClick("confirm")}>
          {page["8"]}
        </GcdsButton>{" "}
        <GcdsButton
          buttonRole="secondary"
          onClick={() => onClick("cancel")}
        >
          {page["9"]}
        </GcdsButton>
      {/* </div> */}

      <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={page["10"]}>
        <GcdsText>
          <strong>{page["11"]}</strong>
        </GcdsText>
      </GcdsNotice>

      <GcdsHeading tag="h1">{page["12"]}</GcdsHeading>
      <GcdsHeading tag="h4">{page["13"]}</GcdsHeading>

      <GcdsText>{page["14"]}</GcdsText>
      <GcdsText>{page["15"]}</GcdsText>

      <div style={{ margin: "1rem 0" }}>
        <GcdsButton onClick={() => onClick("back")}>
          {page["16"]}
        </GcdsButton>{" "}
        <GcdsButton
          buttonRole="secondary"
          onClick={() => onClick("signOut")}
        >
          {page["17"]}
        </GcdsButton>
      </div>
    </GcdsContainer>
  );
}
