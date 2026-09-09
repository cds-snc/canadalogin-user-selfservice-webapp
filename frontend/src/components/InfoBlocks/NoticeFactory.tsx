import { GcdsText } from "@gcds-core/components-react";

import AccessibleNotice from "./AccessibleNotice";
import { useTranslation } from "react-i18next";
import type { ReactElement } from "react";

export type NoticeType =
  | "mfaDeleted"
  | "mfaAdded"
  | "passkeyAdded"
  | "passkeyDeleted";

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
  const { t } = useTranslation("otp");

  const NoticeComponents: Record<
    NoticeType,
    (props: NoticeContentProps) => ReactElement
  > = {
    mfaDeleted: ({ phoneNumber: currentPhoneNumber }) => (
      <GcdsText>
        <AccessibleNotice
          noticeRole="success"
          noticeTitleTag="h2"
          noticeTitle={" "}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <GcdsText>
            {t("NoticeFactory.successfullyDeleted")}{" "}
            <strong>{currentPhoneNumber}</strong>{" "}
            {t("NoticeFactory.fromVerificationNumbers")}
          </GcdsText>
        </AccessibleNotice>
      </GcdsText>
    ),

    mfaAdded: ({
      phoneNumber: currentPhoneNumber,
      otpType: currentOtpType,
    }) => (
      <GcdsText>
        <AccessibleNotice
          noticeRole="success"
          noticeTitleTag="h2"
          noticeTitle={" "}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <GcdsText>
            {t("NoticeFactory.successfullyAdded")} {currentOtpType}{" "}
            {t("NoticeFactory.verificationFor")}{" "}
            <strong>{currentPhoneNumber}</strong>
          </GcdsText>
        </AccessibleNotice>
      </GcdsText>
    ),

    passkeyAdded: () => (
      <GcdsText>
        <AccessibleNotice
          noticeRole="success"
          noticeTitleTag="h2"
          noticeTitle={t("NoticeFactory.notice_title_success")}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <GcdsText>{t("NoticeFactory.passkeyCreated")}</GcdsText>
        </AccessibleNotice>
      </GcdsText>
    ),

    passkeyDeleted: ({ passkeyName: currentPasskeyName }) => (
      <GcdsText>
        <AccessibleNotice
          noticeRole="success"
          noticeTitleTag="h2"
          noticeTitle={t("NoticeFactory.notice_title_success")}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <GcdsText>
            {t("NoticeFactory.yourPasskey")}{" "}
            <strong>{currentPasskeyName}</strong>{" "}
            {t("NoticeFactory.deletedFromCanadaLogin")}
          </GcdsText>
        </AccessibleNotice>
      </GcdsText>
    ),
  };

  const NoticeComponent = NoticeComponents[noticeType];
  if (!NoticeComponent) {
    return null;
  }

  return NoticeComponent({ phoneNumber, otpType, passkeyName });
}
