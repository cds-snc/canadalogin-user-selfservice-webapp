import { useParams } from "react-router";
import {
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsLink,
} from "@cdssnc/gcds-components-react";
import { useNavigate } from "react-router";

import { PAGES, LANGUAGE_DISPLAY_NAMES } from "../../../utils/constants.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { useUser } from "../../../components/Providers/useUser.tsx";

export default function ViewLanguagePreferences({ pageContent }) {
  const { language } = useParams();
  const { state } = useUser();
  const navigate = useNavigate();
  const preferredLanguage = state?.userProfile?.preferredLanguage || "";

  const editLanguagePreferences = path(PAGES.editLanguagePreferences, {
    language: language,
  });

  return (
    <>
      <GcdsHeading tag="h3" marginTop="300">
        {pageContent["13"]}
      </GcdsHeading>
      <GcdsGrid columns="1fr auto" className="gridInline">
        <GcdsText>
          {LANGUAGE_DISPLAY_NAMES[language][preferredLanguage]}
        </GcdsText>
        <GcdsLink
          href={editLanguagePreferences}
          size="regular"
          onGcdsClick={(ev) => {
            ev.preventDefault();
            navigate(ev.detail);
          }}
        >
          {pageContent["5"]}
        </GcdsLink>
      </GcdsGrid>
    </>
  );
}
