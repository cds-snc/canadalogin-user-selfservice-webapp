import {
  GcdsContainer,
  GcdsNotice,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";
import { FLOW_TYPES, PAGES } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";

export default function AddSecond2FA({ secondMfaType, newPhoneNumber }) {
  const { language } = useParams();
  const pageContentJson = getPageContent(
    language,
    secondMfaType === FLOW_TYPES.voice
      ? PAGES.AddSecond2FAVoiceCall
      : PAGES.AddSecond2FATextMessage,
  );
  return (
    <GcdsContainer>
      <GcdsNotice type="success" noticeTitleTag="h2">
        <GcdsText>
          {pageContentJson["1"]} {newPhoneNumber} {pageContentJson["2"]}
        </GcdsText>
      </GcdsNotice>
    </GcdsContainer>
  );
}
