import { useNavigate, useParams } from "react-router";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsLink,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { DEV_ONLY_FEATURE, PAGES } from "../../utils/constants";
import { useUser } from "../Providers/useUser";
import VerifiedBadge from "../Badges/VerifiedBadge";
import ViewContactPhoneNumber from "../../features/ContactPhoneNumber/components/ViewContactPhoneNumber";
import ViewNameCard from "../../features/ProfileName/components/ViewProfileNameCard";
import ViewLanguagePreferences from "../../features/LanguagePreference/components/ViewLanguagePreference";
import { path } from "../../utils/routeHelpers";
import ProvenInformationCard from "../../features/IDV/ProvenInformationCard";

interface DisplayEmailInfoProps {
  email: string;
}

type GcdsNavigationEvent = CustomEvent<string> & {
  preventDefault: () => void;
};

const DisplayEmailInfo = ({ email }: DisplayEmailInfoProps) => {
  const { language } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("profile");
  const editEmail = path(PAGES.editEmailPage, {
    language,
  });

  return (
    <>
      <GcdsHeading tag="h3" marginTop="300">
        {t("ProfileHome.email")}
      </GcdsHeading>
      <GcdsText>{t("ProfileHome.emailDescription")}</GcdsText>
      <GcdsGrid columns="1fr auto" className="gridInline">
        <GcdsText>{email}</GcdsText>
        {DEV_ONLY_FEATURE && (
          <GcdsLink
            href={editEmail}
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
      <VerifiedBadge text={t("ProfileHome.verified")} />
    </>
  );
};

export default function ProfileHome() {
  const { t } = useTranslation("profile");
  const { state } = useUser();
  const email = state?.userProfile?.userName || "";
  const contactNumber = state?.userProfile?.contactNumber ?? null;

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1 auto" gap="300">
        {" "}
        <GcdsHeading tag="h1" marginTop="0">
          {t("ProfileHome.title")}
        </GcdsHeading>
        {DEV_ONLY_FEATURE && (
          <GcdsContainer>
            <GcdsGrid columns="1fr auto" className="gridInline">
              <GcdsHeading tag="h2" marginTop="0">
                {t("ProfileHome.provenInformation")}
              </GcdsHeading>
              <VerifiedBadge text={"Proven January 27, 2026"} />
            </GcdsGrid>

            <ProvenInformationCard />
          </GcdsContainer>
        )}
        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ProfileHome.basicInfo")}
          </GcdsHeading>
          <ViewNameCard />
        </GcdsContainer>
        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ProfileHome.contactInfo")}
          </GcdsHeading>

          <GcdsContainer className="sectionCard">
            <DisplayEmailInfo email={email} />
            <div className="separator" />
            <ViewContactPhoneNumber contactNumber={contactNumber} />
          </GcdsContainer>
        </GcdsContainer>
        <GcdsContainer>
          {" "}
          <GcdsHeading tag="h2" marginTop="0">
            {t("ProfileHome.communication")}
          </GcdsHeading>
          <GcdsContainer className="sectionCard">
            <ViewLanguagePreferences />
            <div className="separator" />
            <GcdsHeading tag="h3" marginTop="300">
              {t("ProfileHome.notifications")}
            </GcdsHeading>
            <GcdsText>{t("ProfileHome.notificationDescription")}</GcdsText>
            <GcdsText>{t("ProfileHome.serviceNotifications")}</GcdsText>
          </GcdsContainer>
        </GcdsContainer>
      </GcdsGrid>
    </GcdsContainer>
  );
}
