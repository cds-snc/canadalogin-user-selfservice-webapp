import { useNavigate, useParams } from "react-router";
import {
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { useUser } from "../../../components/Providers/useUser";
import VerifiedBadge from "../../../components/Badges/VerifiedBadge";
import { path } from "../../../utils/routeHelpers";

type GcdsNavigationEvent = CustomEvent<string> & {
  preventDefault: () => void;
};

export default function DisplayEmailInfo() {
  const { language } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("profile");
  const { state } = useUser();
  const email = state?.userProfile?.userName || "";
  const editEmail = path(PAGES.editEmailPage, {
    language,
  });

  return (
    <>
      <GcdsHeading tag="h3" marginTop="300">
        {t("ProfileHome.email")}
      </GcdsHeading>
      <GcdsText>{t("ProfileHome.emailDescription")}</GcdsText>
      <GcdsGrid columns="1fr auto" className="gridInline">
        <GcdsText>{email}</GcdsText>
        {DEV_ONLY_FEATURE && (
          <GcdsLink
            href={editEmail}
            size="regular"
            onGcdsClick={(event: GcdsNavigationEvent) => {
              event.preventDefault();
              navigate(event.detail);
            }}
          >
            {t("ProfileHome.edit")}
          </GcdsLink>
        )}
      </GcdsGrid>
      <VerifiedBadge text={t("ProfileHome.verified")} />
    </>
  );
}
