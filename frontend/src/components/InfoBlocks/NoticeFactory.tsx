import React from "react";
import { GcdsNotice, GcdsText } from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import { useParams } from "react-router";

interface NoticeFactoryProps {
  noticeType:
    | "mfaDeleted"
    | "mfaAdded"
    | "passkeyAdded"
    | "passkeyDeleted"
    | "passkeyRenamed";
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
  const successBannerJson = getPageContent(language, PAGES.successBanner) || {};

  /**
   * Factory for creating pre-configured notice components
   * This allows you to define reusable notice "templates" that can be passed through navigation
   */
  const NoticeComponents: Record<
    string,
    (props: {
      phoneNumber?: string;
      otpType?: string;
      passkeyName?: string;
    }) => React.ReactNode
  > = {
    mfaDeleted: ({ phoneNumber }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {successBannerJson["1"] as string} <strong>{phoneNumber}</strong>{" "}
            {successBannerJson["2"] as string}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    mfaAdded: ({ phoneNumber, otpType }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {successBannerJson["3"] as string} {otpType}{" "}
            {successBannerJson["4"] as string} <strong>{phoneNumber}</strong>
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    passkeyAdded: ({ passkeyName }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {successBannerJson["3"] as string} <strong>{passkeyName}</strong>{" "}
            {successBannerJson["7"] as string}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    passkeyDeleted: ({ passkeyName }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {successBannerJson["1"] as string} <strong>{passkeyName}</strong>{" "}
            {successBannerJson["8"] as string}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    passkeyRenamed: ({ passkeyName }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {successBannerJson["9"] as string} <strong>{passkeyName}</strong>
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
