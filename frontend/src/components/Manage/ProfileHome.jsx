import { useParams } from "react-router";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
} from "@cdssnc/gcds-components-react";

import { getPageContent } from "../../utils/functions.jsx";
import { PAGES } from "../../utils/constants.jsx";
import { useUser } from "../Providers/useUser.tsx";
import VerifiedBadge from "../Badges/VerifiedBadge.jsx";
import ViewContactPhoneNumber from "../../features/ContactPhoneNumber/components/ViewContactPhoneNumber.jsx";
import ViewNameCard from "../../features/ProfileName/components/ViewProfileNameCard.jsx";
import ViewLanguagePreferences from "../../features/LanguagePreference/components/ViewLanguagePreference.jsx";

const DisplayEmailInfo = ({ email, pageContent }) => {
  return (
    <>
      <GcdsHeading tag="h3" marginTop="300">
        {pageContent["7"]}
      </GcdsHeading>
      <GcdsText>{pageContent["8"]}</GcdsText>
      <GcdsGrid columns="1fr auto" className="gridInline">
        <GcdsText>{email}</GcdsText>
      </GcdsGrid>
      <VerifiedBadge text={pageContent["9"]} />
    </>
  );
};

export default function ProfileHome() {
  const { language } = useParams();
  const pageContent = getPageContent(language, PAGES.ProfileHome);
  const { state } = useUser();
  const email = state?.userProfile?.userName || "";
  const phoneNumbers = state?.userProfile?.phoneNumbers;

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContent["1"]}</GcdsHeading>
      <GcdsHeading tag="h2">{pageContent["2"]}</GcdsHeading>

      <ViewNameCard pageContent={pageContent} />

      <GcdsHeading tag="h2" marginTop="300">
        {pageContent["6"]}
      </GcdsHeading>
      <GcdsContainer className="sectionCard">
        <DisplayEmailInfo email={email} pageContent={pageContent} />

        <div className="separator" />
        <ViewContactPhoneNumber
          pageContent={pageContent}
          phoneNumbers={phoneNumbers}
        />
      </GcdsContainer>

      <GcdsHeading tag="h2">{pageContent["12"]}</GcdsHeading>
      <GcdsContainer className="sectionCard">
        <ViewLanguagePreferences pageContent={pageContent} />
        <div className="separator" />
        <GcdsHeading tag="h3" marginTop="300">
          {pageContent["15"]}
        </GcdsHeading>
        <GcdsText>{pageContent["16"]}</GcdsText>
        <GcdsText>{pageContent["17"]}</GcdsText>
      </GcdsContainer>
    </GcdsContainer>
  );
}
