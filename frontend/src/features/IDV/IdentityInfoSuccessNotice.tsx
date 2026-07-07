import { GcdsNotice } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";

import { DEV_ONLY_FEATURE } from "../../utils/constants";

interface IdentityInfoSuccessNoticeProps {
  showIDVSuccessNotice?: boolean;
}

export default function IdentityInfoSuccessNotice({
  showIDVSuccessNotice = false,
}: IdentityInfoSuccessNoticeProps) {
  const { t } = useTranslation("profile");

  if (!showIDVSuccessNotice || !DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsNotice
      noticeRole="success"
      noticeTitleTag="h2"
      noticeTitle={t("ProfileHome.successNoticeTitle")}
    >
      &nbsp;
    </GcdsNotice>
  );
}
