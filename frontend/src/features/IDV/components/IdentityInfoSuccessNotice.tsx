import { GcdsNotice } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { DEV_ONLY_FEATURE } from "../../../utils/constants";

interface IdentityInfoSuccessNoticeProps {
  show?: boolean;
}

export default function IdentityInfoSuccessNotice({
  show = true,
}: IdentityInfoSuccessNoticeProps) {
  const { t } = useTranslation("profile");

  if (!show || !DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsNotice
      noticeRole="success"
      noticeTitleTag="h3"
      noticeTitle={t("ProfileHome.successNoticeTitle")}
    >
      &nbsp;
    </GcdsNotice>
  );
}
