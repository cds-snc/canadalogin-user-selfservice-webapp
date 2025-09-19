import { useParams } from "react-router";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsLink,
  GcdsIcon,
} from "@cdssnc/gcds-components-react";
import parsePhoneNumberFromString from "libphonenumber-js";

import {
  getPageContent,
  capitalizeFirstLetter,
} from "../../utils/functions.jsx";
import { PAGES, LANGUAGE_DISPLAY_NAMES } from "../../utils/constants.jsx";
import { path } from "../../utils/routeHelpers.js";
import { useUser } from "../Providers/useUser.tsx";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";
import VerifiedBadge from "../Badges/VerifiedBadge.jsx";

const DisplayPhoneNumbers = ({ phoneNumbers }) => {
  console.log("phoneNumbers", phoneNumbers);

  return (
    <>
      <GcdsGrid columns="1fr">
        {phoneNumbers.map((phoneNumber, index) => {
          let profilePhoneNumber = `+${phoneNumber.value}`;
          let numberType = capitalizeFirstLetter(phoneNumber.type);
          const isLast = index === phoneNumbers.length - 1;

          try {
            const parsedPhoneNumber =
              parsePhoneNumberFromString(profilePhoneNumber);

            if (parsedPhoneNumber) {
              profilePhoneNumber = parsedPhoneNumber.formatInternational();
            }
          } catch (error) {
            console.warn(`Failed to parse phone number: ${phoneNumber.value}`);
            console.warn(`Failed to parse phone number: ${error}`);
          }
          return (
            <GcdsText
              key={index}
              margin-bottom={isLast ? "400" : "0"}
              placeContent="center"
            >
              {numberType}: {profilePhoneNumber}
            </GcdsText>
          );
        })}
      </GcdsGrid>
    </>
  );
};

const ContactPhoneNumber = (props) => {
  const { pageContent, phoneNumbers } = props;
  return (
    <>
      <GcdsHeading tag="h3" marginTop="300">
        {pageContent["10"]}
      </GcdsHeading>
      <GcdsText>{pageContent["11"]}</GcdsText>

      <GcdsGrid columns="1fr auto" className="gridInline">
        <DisplayPhoneNumbers phoneNumbers={phoneNumbers} />

        <GcdsLink href="#" size="regular">
          {pageContent["5"]}
        </GcdsLink>
      </GcdsGrid>

      <GcdsGrid
        columns="auto auto"
        className="verifiedBadge verifiedBadgeBottom"
      >
        <GcdsIcon
          name="checkmark-circle"
          className="verifiedIcon"
          size="text"
        />
        <GcdsText className="verifiedText">{pageContent["9"]}</GcdsText>
      </GcdsGrid>
    </>
  );
};

export default function ProfileHome() {
  const { language } = useParams();
  const pageContent = getPageContent(language, PAGES.ProfileHome);
  const { state } = useUser();
  const navigateHelper = useNavigateHelper();
  const name = state?.userProfile?.name?.formatted || "";
  const email = state?.userProfile?.userName || "";
  const phoneNumbers = state?.userProfile?.phoneNumbers;
  const preferredLanguage = state?.userProfile?.preferredLanguage || "";

  const editProfile = path(PAGES.profileUpdateName, { language: language });
  const editLanguagePreferences = path(PAGES.editLanguagePreferences, {
    language: language,
  });

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContent["1"]}</GcdsHeading>
      <GcdsHeading tag="h2">{pageContent["2"]}</GcdsHeading>

      <GcdsContainer className="sectionCard">
        <GcdsHeading tag="h6" marginTop="300">
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

      <GcdsHeading tag="h2" marginTop="300">
        {pageContent["6"]}
      </GcdsHeading>
      <GcdsContainer className="sectionCard">
        <GcdsHeading tag="h3" marginTop="300">
          {pageContent["7"]}
        </GcdsHeading>
        <GcdsText>{pageContent["8"]}</GcdsText>

        <GcdsGrid columns="1fr auto" className="gridInline">
          <GcdsText>{email}</GcdsText>
          <GcdsLink href="#" size="regular">
            {pageContent["5"]}
          </GcdsLink>
        </GcdsGrid>

        <VerifiedBadge text={pageContent["9"]} />

        {phoneNumbers != null ? (
          <>
            <div className="separator" />
            <ContactPhoneNumber
              pageContent={pageContent}
              phoneNumbers={phoneNumbers}
            />
          </>
        ) : null}
      </GcdsContainer>

      <GcdsHeading tag="h2">{pageContent["12"]}</GcdsHeading>
      <GcdsContainer className="sectionCard">
        <GcdsHeading tag="h3" marginTop="300">
          {pageContent["13"]}
        </GcdsHeading>
        <GcdsGrid columns="1fr auto" className="gridInline">
          <GcdsText>{LANGUAGE_DISPLAY_NAMES[preferredLanguage]}</GcdsText>
          <GcdsLink
            href={editLanguagePreferences}
            size="regular"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              navigateHelper(ev.detail);
            }}
          >
            {pageContent["5"]}
          </GcdsLink>
        </GcdsGrid>

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
