import { useParams } from "react-router";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsLink,
  GcdsButton,
} from "@cdssnc/gcds-components-react";
import parsePhoneNumberFromString from "libphonenumber-js";

import { PAGES } from "../../../utils/constants";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";
import VerifiedBadge from "../../../components/Badges/VerifiedBadge.jsx";
import { path } from "../../../utils/routeHelpers";

const DisplayPhoneNumbers = ({ phoneNumbers }) => {
  return (
    <>
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
            console.warn(`Failed to parse phone number: ${error}`);
          }
          return (
            <GcdsText
              key={index}
              margin-bottom={isLast ? "400" : "0"}
              placeContent="center"
            >
              {profilePhoneNumber}
            </GcdsText>
          );
        })}
      </GcdsGrid>
    </>
  );
};

const AddPhoneNumber = (props) => {
  const { pageContent, language } = props;
  const navigateHelper = useNavigateHelper();
  const newContactPhoneNumber = path(PAGES.editContactPhoneNumberPage, {
    language: language,
  });

  return (
    <>
      <GcdsGrid columns="1fr auto">
        <section>
          <GcdsText>{pageContent["18"]}</GcdsText>
        </section>
        <GcdsButton onGcdsClick={() => navigateHelper(newContactPhoneNumber)}>
          + {pageContent["19"]}
        </GcdsButton>
      </GcdsGrid>
    </>
  );
};

const ContactPhoneNumber = (props) => {
  const { pageContent, phoneNumbers, language } = props;
  const newContactPhoneNumber = path(PAGES.editContactPhoneNumberPage, {
    language: language,
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
          onGcdsClick={(ev) => {
            ev.preventDefault();
            navigateHelper(ev.detail);
          }}
        >
          {pageContent["5"]}
        </GcdsLink>
      </GcdsGrid>
      <VerifiedBadge text={pageContent["9"]} />
    </>
  );
};

export default function ViewContactPhoneNumber({ pageContent, phoneNumbers }) {
  const { language } = useParams();
  return (
    <GcdsContainer>
      <GcdsHeading tag="h3" marginTop="300">
        {pageContent["10"]}
      </GcdsHeading>
      {phoneNumbers !== null && phoneNumbers.length > 0 ? (
        <>
          <ContactPhoneNumber
            pageContent={pageContent}
            phoneNumbers={phoneNumbers}
            language={language}
          />
        </>
      ) : (
        <AddPhoneNumber pageContent={pageContent} language={language} />
      )}
    </GcdsContainer>
  );
}
