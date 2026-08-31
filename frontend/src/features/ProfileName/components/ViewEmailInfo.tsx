import { useNavigate, useParams } from "react-router";
import {
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { PAGES } from "../../../utils/constants";
import { useUser } from "../../../components/Providers/useUser";
import VerifiedBadge from "../../../components/Badges/VerifiedBadge";
import { path } from "../../../utils/routeHelpers";

type GcdsNavigationEvent = CustomEvent<string> & {
  preventDefault: () => void;
};

export default function DisplayEmailInfo() {
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";
  const navigate = useNavigate();
  const { t } = useTranslation("profile");
  const { state } = useUser();
  const email = state?.userProfile?.userName || "";
  const emailActionLabel =
    routeLanguage === "en" ? t("ProfileHome.change") : t("ProfileHome.edit");
  const editEmail = path(PAGES.editEmailPage, {
    language: routeLanguage,
  });

  return (
    <>
      <GcdsHeading tag="h3" marginTop="300">
        {t("ProfileHome.email")}
      </GcdsHeading>
      <GcdsText>{t("ProfileHome.emailDescription")}</GcdsText>
      <GcdsGrid columns="1fr auto" className="gridInline">
        <GcdsText>{email}</GcdsText>
        <GcdsLink
          href={editEmail}
          size="regular"
          onGcdsClick={(event: GcdsNavigationEvent) => {
            event.preventDefault();
            navigate(event.detail);
          }}
        >
          {emailActionLabel}
        </GcdsLink>
      </GcdsGrid>
      <VerifiedBadge text={t("ProfileHome.verified")} />
    </>
  );
}
