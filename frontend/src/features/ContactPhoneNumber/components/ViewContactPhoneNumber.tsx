import { useParams } from "react-router";
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

import { PAGES } from "../../../utils/constants";
import { useNavigateHelper } from "../../../hooks/useNavigate";
import VerifiedBadge from "../../../components/Badges/VerifiedBadge";
import { path } from "../../../utils/routeHelpers";
import type {
  ContactPhoneDisplayEntry,
  ContactPhoneDisplaySectionProps,
  GcdsNavigationEvent,
} from "../../../types/contactPhoneNumber";

function DisplayPhoneNumbers({
  phoneNumbers,
}: Pick<ContactPhoneDisplaySectionProps, "phoneNumbers">) {
  return (
    <GcdsGrid columns="1fr">
      {phoneNumbers.map((phoneNumber, index) => {
        let profilePhoneNumber = phoneNumber.value;
        const isLast = index === phoneNumbers.length - 1;

        try {
          const parsedPhoneNumber =
            parsePhoneNumberFromString(profilePhoneNumber);

          if (parsedPhoneNumber) {
            profilePhoneNumber = parsedPhoneNumber.formatNational();
          }
        } catch (error) {
          console.warn(`Failed to parse phone number: ${phoneNumber.value}`);
          console.warn("Failed to parse phone number:", error);
        }

        return (
          <GcdsText
            key={`${phoneNumber.value}-${index}`}
            marginBottom={isLast ? "400" : "0"}
            style={{ placeContent: "center" }}
          >
            {profilePhoneNumber}
          </GcdsText>
        );
      })}
    </GcdsGrid>
  );
}

function AddPhoneNumber({ language }: { language?: string }) {
  const { t } = useTranslation("profile");
  const navigateHelper = useNavigateHelper();
  const newContactPhoneNumber = path(PAGES.editContactPhoneNumberPage, {
    language,
  });

  return (
    <GcdsGrid columns="1fr auto">
      <section>
        <GcdsText>{t("ProfileHome.noPhoneAdded")}</GcdsText>
      </section>
      <GcdsButton onGcdsClick={() => navigateHelper(newContactPhoneNumber)}>
        + {t("ProfileHome.addPhoneNumber")}
      </GcdsButton>
    </GcdsGrid>
  );
}

function ContactPhoneNumber({
  phoneNumbers,
  language,
}: {
  phoneNumbers: ContactPhoneDisplayEntry[];
  language?: string;
}) {
  const { t } = useTranslation("profile");
  const newContactPhoneNumber = path(PAGES.editContactPhoneNumberPage, {
    language,
  });
  const navigateHelper = useNavigateHelper();

  return (
    <>
      <GcdsText>{t("ProfileHome.phoneDescription")}</GcdsText>

      <GcdsGrid columns="1fr auto">
        <DisplayPhoneNumbers phoneNumbers={phoneNumbers} />
        <GcdsLink
          href={newContactPhoneNumber}
          size="regular"
          onGcdsClick={(event: GcdsNavigationEvent) => {
            event.preventDefault();
            navigateHelper(event.detail);
          }}
        >
          {t("ProfileHome.edit")}
        </GcdsLink>
      </GcdsGrid>
      <VerifiedBadge text={t("ProfileHome.verified")} />
    </>
  );
}

export default function ViewContactPhoneNumber({
  phoneNumbers,
}: {
  phoneNumbers: ContactPhoneDisplayEntry[] | null;
}) {
  const { language } = useParams<{ language: string }>();
  const { t } = useTranslation("profile");

  return (
    <GcdsContainer>
      <GcdsHeading tag="h3" marginTop="300">
        {t("ProfileHome.contactPhone")}
      </GcdsHeading>
      {phoneNumbers && phoneNumbers.length > 0 ? (
        <ContactPhoneNumber phoneNumbers={phoneNumbers} language={language} />
      ) : (
        <AddPhoneNumber language={language} />
      )}
    </GcdsContainer>
  );
}
