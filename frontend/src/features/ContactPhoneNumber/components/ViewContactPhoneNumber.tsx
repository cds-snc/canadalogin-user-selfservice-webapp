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

import { PAGES } from "../../../utils/constants";
import { useNavigateHelper } from "../../../hooks/useNavigate";
import VerifiedBadge from "../../../components/Badges/VerifiedBadge";
import { path } from "../../../utils/routeHelpers";
import type {
  ContactPhoneDisplayProps,
  ContactPhoneDisplaySectionProps,
  ContactPhoneSectionProps,
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

function AddPhoneNumber({ pageContent, language }: ContactPhoneSectionProps) {
  const navigateHelper = useNavigateHelper();
  const newContactPhoneNumber = path(PAGES.editContactPhoneNumberPage, {
    language,
  });

  return (
    <GcdsGrid columns="1fr auto">
      <section>
        <GcdsText>{pageContent["18"]}</GcdsText>
      </section>
      <GcdsButton onGcdsClick={() => navigateHelper(newContactPhoneNumber)}>
        + {pageContent["19"]}
      </GcdsButton>
    </GcdsGrid>
  );
}

function ContactPhoneNumber({
  pageContent,
  phoneNumbers,
  language,
}: ContactPhoneDisplaySectionProps) {
  const newContactPhoneNumber = path(PAGES.editContactPhoneNumberPage, {
    language,
  });
  const navigateHelper = useNavigateHelper();

  return (
    <>
      <GcdsText>{pageContent["11"]}</GcdsText>

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
          {pageContent["5"]}
        </GcdsLink>
      </GcdsGrid>
      <VerifiedBadge text={pageContent["9"]} />
    </>
  );
}

export default function ViewContactPhoneNumber({
  pageContent,
  phoneNumbers,
}: ContactPhoneDisplayProps) {
  const { language } = useParams<{ language: string }>();

  return (
    <GcdsContainer>
      <GcdsHeading tag="h3" marginTop="300">
        {pageContent["10"]}
      </GcdsHeading>
      {phoneNumbers && phoneNumbers.length > 0 ? (
        <ContactPhoneNumber
          pageContent={pageContent}
          phoneNumbers={phoneNumbers}
          language={language}
        />
      ) : (
        <AddPhoneNumber pageContent={pageContent} language={language} />
      )}
    </GcdsContainer>
  );
}
