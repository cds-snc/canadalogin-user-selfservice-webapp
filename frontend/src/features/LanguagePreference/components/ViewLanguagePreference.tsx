import { useNavigate, useParams } from "react-router";
import {
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@cdssnc/gcds-components-react";

import { PAGES, LANGUAGE_DISPLAY_NAMES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { useUser } from "../../../components/Providers/useUser";
import type {
  GcdsNavigationEvent,
  LanguagePreferenceViewProps,
} from "../../../types/languagePreference";

export default function ViewLanguagePreferences({
  pageContent,
}: LanguagePreferenceViewProps) {
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
        {pageContent["13"]}
      </GcdsHeading>
      <GcdsGrid columns="1fr auto" className="gridInline">
        <GcdsText>{displayLanguageName}</GcdsText>
        <GcdsLink
          href={editLanguagePreferences}
          size="regular"
          onGcdsClick={(event: GcdsNavigationEvent) => {
            event.preventDefault();
            navigate(event.detail);
          }}
        >
          {pageContent["5"]}
        </GcdsLink>
      </GcdsGrid>
    </>
  );
}
