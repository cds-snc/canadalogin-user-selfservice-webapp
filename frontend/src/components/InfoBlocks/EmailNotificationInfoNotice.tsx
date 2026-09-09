import { GcdsText } from "@gcds-core/components-react";

import AccessibleNotice from "./AccessibleNotice";

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
    <AccessibleNotice
      noticeRole="info"
      noticeTitleTag="h2"
      noticeTitle={title}
      lang={lang}
    >
      <GcdsText>{description}</GcdsText>
    </AccessibleNotice>
  );
}
