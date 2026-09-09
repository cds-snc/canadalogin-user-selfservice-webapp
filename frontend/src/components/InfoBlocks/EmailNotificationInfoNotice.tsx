import { GcdsNotice, GcdsText } from "@gcds-core/components-react";

interface EmailNotificationInfoNoticeProps {
  title: string;
  description: string;
  lang?: string;
}

export default function EmailNotificationInfoNotice({
  title,
  description,
  lang,
}: EmailNotificationInfoNoticeProps) {
  return (
    <GcdsNotice
      noticeRole="info"
      noticeTitleTag="h2"
      noticeTitle={title}
      lang={lang}
    >
      <GcdsText>{description}</GcdsText>
    </GcdsNotice>
  );
}
