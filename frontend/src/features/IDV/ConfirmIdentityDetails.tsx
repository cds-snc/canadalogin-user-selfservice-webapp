import { useNavigate, useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@gcds-core/components-react";
import parsePhoneNumberFromString from "libphonenumber-js";

import { useTranslation } from "react-i18next";
import { DEV_ONLY_FEATURE, PAGES } from "../../utils/constants";
import { useUser } from "../../components/Providers/useUser";
import VerifiedBadge from "../../components/Badges/VerifiedBadge";
import ViewLanguagePreferences from "../../features/LanguagePreference/components/ViewLanguagePreference";
import { path } from "../../utils/routeHelpers";

interface DisplayPreferredNameInfoProps {
  name: string;
}

interface DisplayEmailInfoProps {
  email: string;
}

type GcdsNavigationEvent = CustomEvent<string> & {
  preventDefault: () => void;
};

const hintTextStyle = { color: "#43474E", fontWeight: 400 };

const DisplayPreferredNameInfo = ({ name }: DisplayPreferredNameInfoProps) => {
  const { language } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("profile");
  const { t: tIdv } = useTranslation("idv");
  const editProfileName = path(PAGES.editProfileNamePage, {
    language,
  });

  return (
    <>
      <GcdsHeading tag="h3" marginTop="300">
        {t("ProfileHome.preferredName")}
      </GcdsHeading>
      <GcdsText style={hintTextStyle}>
        {tIdv("ConfirmIdentityDetails.preferredNameHint")}
      </GcdsText>
      <GcdsGrid columns="1fr auto" className="gridInline">
        <GcdsText>{name}</GcdsText>
        {DEV_ONLY_FEATURE && (
          <GcdsLink
            href={editProfileName}
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
      {name && <VerifiedBadge text={t("ProfileHome.verified")} />}
    </>
  );
};

const DisplayEmailInfo = ({ email }: DisplayEmailInfoProps) => {
  const { language } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("profile");
  const { t: tIdv } = useTranslation("idv");
  const editEmail = path(PAGES.editEmailPage, {
    language,
  });

  return (
    <>
      <GcdsHeading tag="h3" marginTop="300">
        {t("ProfileHome.email")}
      </GcdsHeading>
      <GcdsText style={hintTextStyle}>
        {tIdv("ConfirmIdentityDetails.emailHint")}
      </GcdsText>
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
      {email && <VerifiedBadge text={t("ProfileHome.verified")} />}
    </>
  );
};

interface DisplayPhoneNumberInfoProps {
  phoneNumbers: Array<{ value: string; type: string }>;
}

const DisplayPhoneNumberInfo = ({
  phoneNumbers,
}: DisplayPhoneNumberInfoProps) => {
  const { language } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("profile");
  const { t: tIdv } = useTranslation("idv");
  const editPhone = path(PAGES.editContactPhoneNumberPage, {
    language,
  });

  const rawPhoneNumber = phoneNumbers[0]?.value || "";
  let formattedPhoneNumber = rawPhoneNumber;

  try {
    const parsedPhoneNumber = parsePhoneNumberFromString(rawPhoneNumber);
    if (parsedPhoneNumber) {
      formattedPhoneNumber = parsedPhoneNumber.formatNational();
    }
  } catch {
    formattedPhoneNumber = rawPhoneNumber;
  }

  return (
    <>
      <GcdsHeading tag="h3" marginTop="300">
        {tIdv("ConfirmIdentityDetails.phoneNumber")}
      </GcdsHeading>
      <GcdsText style={hintTextStyle}>
        {tIdv("ConfirmIdentityDetails.phoneNumberHint")}
      </GcdsText>
      <GcdsGrid columns="1fr auto" className="gridInline">
        <GcdsText>
          {formattedPhoneNumber || t("ProfileHome.noPhoneAdded")}
        </GcdsText>
        {DEV_ONLY_FEATURE && (
          <GcdsLink
            href={editPhone}
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
      {rawPhoneNumber && <VerifiedBadge text={t("ProfileHome.verified")} />}
    </>
  );
};

export default function ConfirmIdentityDetails() {
  const { t } = useTranslation("idv");
  const navigate = useNavigate();
  const { language } = useParams();
  const { state } = useUser();

  const name = state?.userProfile?.name?.formatted || "";
  const email = state?.userProfile?.userName || "";
  const phoneNumbers = state?.userProfile?.phoneNumbers || [];
  const startIdentityProofingPage = path(PAGES.idvStartIdentityProofingPage, {
    language,
  });

  // TODO: Replace placeholders once IDV API returns these values.
  const dateOfBirth = t("ConfirmIdentityDetails.dateOfBirthValue");
  const idDocument = t("ConfirmIdentityDetails.idDocumentValue");

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1" marginTop="0">
            {t("ConfirmIdentityDetails.pageTitle")}
          </GcdsHeading>
          <GcdsText>{t("ConfirmIdentityDetails.description")}</GcdsText>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ConfirmIdentityDetails.identityProofingDetails")}
          </GcdsHeading>

          <GcdsContainer className="sectionCard">
            <GcdsHeading tag="h3" marginTop="300">
              {t("ConfirmIdentityDetails.name")}
            </GcdsHeading>
            <GcdsText>{name}</GcdsText>
            <div className="separator" />

            <GcdsHeading tag="h3" marginTop="300">
              {t("ConfirmIdentityDetails.dateOfBirth")}
            </GcdsHeading>
            <GcdsText>{dateOfBirth}</GcdsText>
            <div className="separator" />

            <GcdsHeading tag="h3" marginTop="300">
              {t("ConfirmIdentityDetails.idDocumentSavedToCanadaLogin")}
            </GcdsHeading>
            <GcdsText>{idDocument}</GcdsText>
            <div className="separator" />
            <GcdsText>
              {t("ConfirmIdentityDetails.reProofingRequired")}
            </GcdsText>
            <GcdsButton
              buttonRole="secondary"
              type="button"
              onGcdsClick={(event) => {
                event.preventDefault();
                navigate(startIdentityProofingPage);
              }}
            >
              {t("ConfirmIdentityDetails.updateInformation")}
            </GcdsButton>
          </GcdsContainer>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ConfirmIdentityDetails.contactInfo")}
          </GcdsHeading>
          <GcdsContainer className="sectionCard">
            <DisplayPreferredNameInfo name={name} />
            <div className="separator" />
            <DisplayEmailInfo email={email} />
            <div className="separator" />
            <DisplayPhoneNumberInfo phoneNumbers={phoneNumbers} />
          </GcdsContainer>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ConfirmIdentityDetails.communication")}
          </GcdsHeading>
          <GcdsContainer className="sectionCard">
            <ViewLanguagePreferences />
          </GcdsContainer>
        </GcdsContainer>

        <GcdsButton
          type="button"
          onGcdsClick={(event) => {
            event.preventDefault();
            // TODO: Replace with final post-confirmation destination.
            navigate("");
          }}
        >
          {t("ConfirmIdentityDetails.confirmAndContinue")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
