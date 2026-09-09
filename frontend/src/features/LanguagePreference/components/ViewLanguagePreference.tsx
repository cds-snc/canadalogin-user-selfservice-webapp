import { useNavigate, useParams } from "react-router";
import { GcdsHeading, GcdsLink, GcdsText } from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { PAGES, LANGUAGE_DISPLAY_NAMES } from "../../../utils/constants";
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
  const editLanguageAriaLabel = `${t("ProfileHome.edit")} ${t("ProfileHome.languagePreference")}`;

  return (
    <>
      <GcdsHeading tag="h3" marginTop="300">
        {t("ProfileHome.languagePreference")}
      </GcdsHeading>
      <div className="mobileOverflowWrap">
        <div className="mobileOverflowWrapMain">
          <GcdsText>{displayLanguageName}</GcdsText>
        </div>
        <GcdsLink
          href={editLanguagePreferences}
          className="mobileOverflowWrapAction"
          size="regular"
          aria-label={editLanguageAriaLabel}
          style={{ textDecoration: "underline" }}
          onGcdsClick={(event: GcdsNavigationEvent) => {
            event.preventDefault();
            navigate(event.detail);
          }}
        >
          {t("ProfileHome.edit")}
        </GcdsLink>
      </div>
    </>
  );
}
