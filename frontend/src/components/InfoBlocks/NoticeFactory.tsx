import { GcdsNotice, GcdsText } from "@gcds-core/components-react";
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
        <GcdsNotice noticeRole="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {t("NoticeFactory.successfullyDeleted")}{" "}
            <strong>{currentPhoneNumber}</strong>{" "}
            {t("NoticeFactory.fromVerificationNumbers")}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    mfaAdded: ({
      phoneNumber: currentPhoneNumber,
      otpType: currentOtpType,
    }) => (
      <GcdsText>
        <GcdsNotice noticeRole="success" noticeTitleTag="h2" noticeTitle={" "}>
          <GcdsText>
            {t("NoticeFactory.successfullyAdded")} {currentOtpType}{" "}
            {t("NoticeFactory.verificationFor")}{" "}
            <strong>{currentPhoneNumber}</strong>
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    passkeyAdded: () => (
      <GcdsText>
        <GcdsNotice
          noticeRole="success"
          noticeTitleTag="h2"
          noticeTitle={t("NoticeFactory.notice_title_success")}
        >
          <GcdsText>{t("NoticeFactory.passkeyCreated")}</GcdsText>
        </GcdsNotice>
      </GcdsText>
    ),

    passkeyDeleted: ({ passkeyName: currentPasskeyName }) => (
      <GcdsText>
        <GcdsNotice
          noticeRole="success"
          noticeTitleTag="h2"
          noticeTitle={t("NoticeFactory.notice_title_success")}
        >
          <GcdsText>
            {t("NoticeFactory.yourPasskey")}{" "}
            <strong>{currentPasskeyName}</strong>{" "}
            {t("NoticeFactory.deletedFromCanadaLogin")}
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
