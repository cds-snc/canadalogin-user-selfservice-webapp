import React from "react";
import { useParams } from "react-router";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsLink,
} from "@cdssnc/gcds-components-react";

import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { useUser } from "../../../components/Providers/useUser";
import { useNavigateHelper } from "../../../hooks/useNavigate";

export default function ViewProfileNameSectionCard({ pageContent }) {
  const { language } = useParams();
  const { state } = useUser();
  const navigateHelper = useNavigateHelper();
  const name = state?.userProfile?.name?.formatted || "";
  const editProfile = path(PAGES.editProfileNamePage, { language: language });

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
          onGcdsClick={(ev) => {
            ev.preventDefault();
            navigateHelper(ev.detail);
          }}
        >
          {pageContent["5"]}
        </GcdsLink>
      </GcdsGrid>
    </GcdsContainer>
  );
}
