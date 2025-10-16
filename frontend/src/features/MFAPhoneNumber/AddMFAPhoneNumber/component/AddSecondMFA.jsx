import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";
import { FLOW_TYPES, PAGES } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";

export default function AddSecondMFA({
  phoneFormData,
  onSkipForNowLink,
  onAddSecondMFA,
}) {
  const { language } = useParams();
  const pageContentJson = getPageContent(
    language,
    phoneFormData.otpType === FLOW_TYPES.voice
      ? PAGES.addSecondMFATextMessage
      : PAGES.addSecondMFAVoiceCall,
  );

  return (
    <GcdsContainer>
      <GcdsText>
        {" "}
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            {pageContentJson["1"]}{" "}
            <strong>{phoneFormData.formattedPhoneNumber} </strong>
            {pageContentJson["2"]}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>

      <GcdsHeading tag="h1">{pageContentJson["3"]}</GcdsHeading>

      <GcdsText>
        {pageContentJson["4"]} <strong>{pageContentJson["5"]}</strong>{" "}
        {pageContentJson["6"]}
      </GcdsText>

      <GcdsText>{pageContentJson["7"]}</GcdsText>

      <GcdsHeading tag="h2">{pageContentJson["8"]}</GcdsHeading>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsText>
          {" "}
          <GcdsButton
            style={{ width: "fit-content" }}
            onGcdsClick={async (ev) => {
              ev.preventDefault();
              await onAddSecondMFA();
            }}
          >
            {pageContentJson["9"]}
          </GcdsButton>
        </GcdsText>
        &nbsp;
        <GcdsLink
          onGcdsClick={async (ev) => {
            ev.preventDefault();
            await onSkipForNowLink();
          }}
        >
          {pageContentJson["10"]}
        </GcdsLink>
      </GcdsGrid>
    </GcdsContainer>
  );
}
