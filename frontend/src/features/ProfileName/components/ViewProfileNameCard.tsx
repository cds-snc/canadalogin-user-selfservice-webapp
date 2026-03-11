import { useParams } from "react-router";
import {
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@cdssnc/gcds-components-react";

import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { useUser } from "../../../components/Providers/useUser";
import { useNavigateHelper } from "../../../hooks/useNavigate";
import type {
  GcdsNavigationEvent,
  ProfileNameViewProps,
} from "../../../types/profileName";

export default function ViewProfileNameCard({
  pageContent,
}: ProfileNameViewProps) {
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
        {pageContent["3"]}
      </GcdsHeading>
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
          {pageContent["5"]}
        </GcdsLink>
      </GcdsGrid>
    </GcdsContainer>
  );
}
