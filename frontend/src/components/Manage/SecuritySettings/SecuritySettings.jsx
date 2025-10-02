import { useParams } from "react-router";
import { format } from "date-fns";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsLink,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { PAGES } from "../../../utils/constants.jsx";

import { useUser } from "../../Providers/useUser.js";
import EnabledBadge from "../../Badges/EnabledBadge.jsx";

export default function SecuritySettings() {
  const { language } = useParams();

  const pageContent = getPageContent(language, PAGES.securitySettings);
  const { state } = useUser();
  const lastPasswordChange = state?.userProfile?.details?.pwdChangedTime || "";
  const formattedPasswordChangeDate = format(
    new Date(lastPasswordChange),
    "MMMM d, yyyy",
  );

  const passwordPage = path(PAGES.password, { language: language });
  const manage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContent["1"]}</GcdsHeading>
      <GcdsHeading tag="h2">{pageContent["2"]}</GcdsHeading>
      <GcdsText>{pageContent["3"]}</GcdsText>
      <GcdsContainer className="sectionCard">
        <GcdsHeading tag="h3">{pageContent["4"]}</GcdsHeading>
        <GcdsGrid columns="1fr" gap="1rem" align-items="center">
          <GcdsText>
            {pageContent["5"]} {formattedPasswordChangeDate}
          </GcdsText>
          <GcdsLink size="regular" href={passwordPage}>
            {pageContent["6"]}
          </GcdsLink>
        </GcdsGrid>
      </GcdsContainer>

      <GcdsContainer className="sectionCard">
        <GcdsHeading tag="h3" marginTop="300">
          {pageContent["7"]}
        </GcdsHeading>
        <GcdsText>{pageContent["8"]}</GcdsText>

        <GcdsGrid columns="1fr" gap="1rem" align-items="center">
          <EnabledBadge text={pageContent["9"]} />
          <GcdsLink href={manage2FAVerificationsPage} size="regular">
            {pageContent["10"]}
          </GcdsLink>
        </GcdsGrid>
      </GcdsContainer>
    </GcdsContainer>
  );
}
