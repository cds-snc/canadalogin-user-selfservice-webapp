import { useParams } from "react-router";
import {
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { useUser } from "../../../components/Providers/useUser";
import { useNavigateHelper } from "../../../hooks/useNavigate";
import type { GcdsNavigationEvent } from "../../../types/profileName";

type ViewProfileNameCardProps = {
  hasBorder?: boolean;
};

export default function ViewProfileNameCard({
  hasBorder = true,
}: ViewProfileNameCardProps) {
  const { t } = useTranslation("profile");
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";
  const { state } = useUser();
  const navigateHelper = useNavigateHelper();
  const name = state?.userProfile?.name?.formatted || "";
  const editProfile = path(PAGES.editProfileNamePage, {
    language: routeLanguage,
  });

  return (
    <GcdsContainer className={hasBorder ? "sectionCard" : undefined}>
      <GcdsHeading tag="h3" marginTop="300">
        {t("ProfileHome.preferredName")}
      </GcdsHeading>
      <GcdsText>{t("ProfileHome.preferredNameDescription")}</GcdsText>
      <GcdsGrid columns="1fr auto" className="gridInline">
        <GcdsText>{name}</GcdsText>
        <GcdsLink
          href={editProfile}
          size="regular"
          onGcdsClick={(event: GcdsNavigationEvent) => {
            event.preventDefault();
            navigateHelper(event.detail);
          }}
        >
          {t("ProfileHome.edit")}
        </GcdsLink>
      </GcdsGrid>
    </GcdsContainer>
  );
}
