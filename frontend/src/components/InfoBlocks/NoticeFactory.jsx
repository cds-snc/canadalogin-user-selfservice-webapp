import { GcdsNotice, GcdsText } from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import { useParams } from "react-router";

export default function NoticeFactory({
  noticeType,
  phoneNumber,
  otpType,
  passkeyName,
}) {
  const { language } = useParams();
  const noticeFactoryContent = getPageContent(language, PAGES.noticeFactory);

  /**
   * Factory for creating pre-configured notice components
   * This allows you to define reusable notice "templates" that can be passed through navigation
   */
  const NoticeComponents = {
    mfaDeleted: ({ phoneNumber }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {noticeFactoryContent["1"]} <strong>{phoneNumber}</strong>{" "}
            {noticeFactoryContent["2"]}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    mfaAdded: ({ phoneNumber, otpType }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {noticeFactoryContent["3"]} {otpType} {noticeFactoryContent["4"]}{" "}
            <strong>{phoneNumber}</strong>
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    passkeyAdded: ({ passkeyName }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {noticeFactoryContent["3"]} <strong>{passkeyName}</strong>{" "}
            {noticeFactoryContent["7"]}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    passkeyDeleted: ({ passkeyName }) => (
      <GcdsText>
        <GcdsNotice
          type="success"
          noticeTitleTag="h2"
          noticeTitle={noticeFactoryContent["notice_title_success"]}
        >
          <GcdsText>
            {noticeFactoryContent["8"]} <strong>{passkeyName}</strong>{" "}
            {noticeFactoryContent["10"]}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    passkeyRenamed: ({ passkeyName }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {noticeFactoryContent["9"]} <strong>{passkeyName}</strong>
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),
  };

  // Handle invalid noticeType gracefully
  const NoticeComponent = NoticeComponents[noticeType];
  if (!NoticeComponent) {
    return null;
  }

  return NoticeComponent({ phoneNumber, otpType, passkeyName });
}
