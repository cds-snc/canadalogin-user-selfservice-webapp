import { useParams } from "react-router";
import { format } from "date-fns";
import { enCA, frCA } from "date-fns/locale";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsLink,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions";
import { path } from "../../../utils/routeHelpers";
import { PAGES, DEV_ONLY_FEATURE } from "../../../utils/constants";

import { useUser } from "../../Providers/useUser";
import EnabledBadge from "../../Badges/EnabledBadge";
import VerifiedBadge from "../../Badges/VerifiedBadge";

export default function SecuritySettings() {
  const { language } = useParams();

  const pageContent = getPageContent(language, PAGES.securitySettings);
  const { state } = useUser();
  const lastPasswordChange = state?.userProfile?.details?.pwdChangedTime || "";
  const formattedPasswordChangeDate = lastPasswordChange
    ? format(new Date(lastPasswordChange), "MMMM d, yyyy", {
        locale: language === "fr" ? frCA : enCA,
      })
    : "";

  const passwordPage = path(PAGES.password, { language });
  const manage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language,
  });

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1">{pageContent["1"]}</GcdsHeading>
      <GcdsHeading tag="h2">{pageContent["2"]}</GcdsHeading>
      <GcdsText>{pageContent["3"]}</GcdsText>
      <GcdsContainer className="sectionCard">
        <GcdsHeading tag="h3">{pageContent["4"]}</GcdsHeading>
        <GcdsGrid columns="1fr" gap="300" align-items="center">
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
        <GcdsGrid columns="1fr" gap="300" align-items="center">
          <EnabledBadge text={pageContent["9"]} />
          <GcdsLink href={manage2FAVerificationsPage} size="regular">
            {pageContent["10"]}
          </GcdsLink>
        </GcdsGrid>
      </GcdsContainer>
      {DEV_ONLY_FEATURE && (
        <GcdsContainer className="sectionCard">
          <GcdsHeading tag="h3" marginTop="300">
            Identity Verification
          </GcdsHeading>
          <GcdsText>
            Some services require users to complete identity verification prior
            to being granted access to the service.
          </GcdsText>
          <GcdsGrid columns="1fr" gap="300" align-items="center">
            <VerifiedBadge text="Identity Verified" />
            <GcdsLink href={manage2FAVerificationsPage} size="regular">
              View Details
            </GcdsLink>
          </GcdsGrid>
        </GcdsContainer>
      )}
    </GcdsContainer>
  );
}
