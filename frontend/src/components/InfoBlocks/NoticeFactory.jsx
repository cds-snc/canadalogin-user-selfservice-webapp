import { GcdsNotice, GcdsText } from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import { useParams } from "react-router";

export default function NoticeFactory({ noticeType, phoneNumber, otpType }) {
  const { language } = useParams();
  const successBannerJson = getPageContent(language, PAGES.successBanner);

  /**
   * Factory for creating pre-configured notice components
   * This allows you to define reusable notice "templates" that can be passed through navigation
   */
  const NoticeComponents = {
    mfaDeleted: ({ phoneNumber }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {successBannerJson["1"]} <strong>{phoneNumber}</strong>{" "}
            {successBannerJson["2"]}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    mfaAdded: ({ phoneNumber, otpType }) => (
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {successBannerJson["3"]} {otpType} {successBannerJson["4"]}{" "}
            <strong>{phoneNumber}</strong>
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

  return NoticeComponent({ phoneNumber, otpType });
}
