import { GcdsNotice, GcdsText } from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import { useParams } from "react-router";
import type { ReactElement } from "react";

export type NoticeType =
  | "mfaDeleted"
  | "mfaAdded"
  | "passkeyAdded"
  | "passkeyDeleted"
  | "passkeyRenamed";

interface NoticeFactoryProps {
  noticeType: NoticeType;
  phoneNumber?: string;
  otpType?: string;
  passkeyName?: string;
}

interface NoticeContentProps {
  phoneNumber?: string;
  otpType?: string;
  passkeyName?: string;
}

export default function NoticeFactory({
  noticeType,
  phoneNumber,
  otpType,
  passkeyName,
}: NoticeFactoryProps) {
  const { language } = useParams();
  const noticeFactoryContent: Record<string, string> =
    getPageContent(language, PAGES.noticeFactory) ?? {};

  const NoticeComponents: Record<
    NoticeType,
    (props: NoticeContentProps) => ReactElement
  > = {
    mfaDeleted: ({ phoneNumber: currentPhoneNumber }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {noticeFactoryContent["1"]} <strong>{currentPhoneNumber}</strong>{" "}
            {noticeFactoryContent["2"]}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    mfaAdded: ({
      phoneNumber: currentPhoneNumber,
      otpType: currentOtpType,
    }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {noticeFactoryContent["3"]} {currentOtpType}{" "}
            {noticeFactoryContent["4"]} <strong>{currentPhoneNumber}</strong>
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    passkeyAdded: ({ passkeyName: currentPasskeyName }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {noticeFactoryContent["3"]} <strong>{currentPasskeyName}</strong>{" "}
            {noticeFactoryContent["7"]}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    passkeyDeleted: ({ passkeyName: currentPasskeyName }) => (
      <GcdsText>
        <GcdsNotice
          type="success"
          noticeTitleTag="h2"
          noticeTitle={noticeFactoryContent["notice_title_success"]}
        >
          <GcdsText>
            {noticeFactoryContent["8"]} <strong>{currentPasskeyName}</strong>{" "}
            {noticeFactoryContent["10"]}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    passkeyRenamed: ({ passkeyName: currentPasskeyName }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {noticeFactoryContent["9"]} <strong>{currentPasskeyName}</strong>
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),
  };

  const NoticeComponent = NoticeComponents[noticeType];
  if (!NoticeComponent) {
    return null;
  }

  return NoticeComponent({ phoneNumber, otpType, passkeyName });
}
