import { useNavigate, useParams } from "react-router";
import {
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import {
  PAGES,
  LANGUAGE_DISPLAY_NAMES,
  DEV_ONLY_FEATURE,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { useUser } from "../../../components/Providers/useUser";
import type { GcdsNavigationEvent } from "../../../types/languagePreference";

export default function ViewLanguagePreferences() {
  const { t } = useTranslation("profile");
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";
  const { state } = useUser();
  const navigate = useNavigate();
  const preferredLanguage = state?.userProfile?.preferredLanguage || "";

  const editLanguagePreferences = path(PAGES.editLanguagePreferences, {
    language: routeLanguage,
  });

  const displayLanguageName =
    LANGUAGE_DISPLAY_NAMES[routeLanguage]?.[
      preferredLanguage as keyof (typeof LANGUAGE_DISPLAY_NAMES)["en"]
    ] || preferredLanguage;

  return (
    <>
      <GcdsHeading tag="h3" marginTop="300">
        {t("ProfileHome.languagePreference")}
      </GcdsHeading>
      <GcdsGrid columns="1fr auto" className="gridInline">
        <GcdsText>{displayLanguageName}</GcdsText>
        {DEV_ONLY_FEATURE && (
          <GcdsLink
            href={editLanguagePreferences}
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
    </>
  );
}
