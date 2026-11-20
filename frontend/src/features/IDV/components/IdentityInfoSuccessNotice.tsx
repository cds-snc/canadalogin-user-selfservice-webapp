import AccessibleNotice from "../../../components/InfoBlocks/AccessibleNotice";
import { useTranslation } from "react-i18next";

import { useIdvFeatureAccess } from "../../../hooks/useIdvFeatureAccess";

interface IdentityInfoSuccessNoticeProps {
  showIDVSuccessNotice?: boolean;
}

export default function IdentityInfoSuccessNotice({
  showIDVSuccessNotice = false,
}: IdentityInfoSuccessNoticeProps) {
  const idvFeatureEnabled = useIdvFeatureAccess();
  const { t } = useTranslation("profile");

  if (!showIDVSuccessNotice || !idvFeatureEnabled) {
    return null;
  }

  return (
    <AccessibleNotice
      noticeRole="success"
      noticeTitleTag="h2"
      noticeTitle={t("ProfileHome.successNoticeTitle")}
    >
      &nbsp;
    </AccessibleNotice>
  );
}
