import { useParams } from "react-router";
import {
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { useUser } from "../../../components/Providers/useUser";
import { useNavigateHelper } from "../../../hooks/useNavigate";
import type { GcdsNavigationEvent } from "../../../types/profileName";

export default function ViewProfileNameCard() {
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
    <GcdsContainer className="sectionCard">
      <GcdsHeading tag="h3" marginTop="300">
        {t("ProfileHome.preferredName")}
      </GcdsHeading>
      <GcdsGrid columns="1fr auto" className="gridInline">
        <GcdsText>{name}</GcdsText>
        {DEV_ONLY_FEATURE && (
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
        )}
      </GcdsGrid>
    </GcdsContainer>
  );
}
