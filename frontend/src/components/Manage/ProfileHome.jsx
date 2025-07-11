import React from 'react';
import { useParams } from 'react-router';
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsLink
} from '@cdssnc/gcds-components-react';
import { getPageContent } from '../../utils/functions.jsx';
import { PAGES } from '../../utils/constants.jsx';
import { useUser } from "../Providers/useUser.tsx";
import parsePhoneNumber from 'libphonenumber-js';


const DisplayPhoneNumbers = ({ phoneNumbers }) => {
  console.log("phoneNumbers", phoneNumbers)

  return (
    <>

      <GcdsGrid columns="1fr">

        {
          phoneNumbers.map((phoneNumber, index) => {
            let formatted = phoneNumber.value;

            try {
              const parsed = parsePhoneNumber(phoneNumber.value, 'US'); // You can change the region if needed
              formatted = parsed.formatNational();

            } catch (e) {
              console.warn(`Failed to parse phone number: ${phoneNumber.value}`);
            }
            return (
              <GcdsText key={index} margin-bottom="0">
                {phoneNumber.type}: {formatted}
              </GcdsText>
            )

          })
        }
      </GcdsGrid>

    </>
  )
}

const ContactPhoneNumber = (props) => {
  const { pageContent, phoneNumbers } = props;
  return (
    <div className="separator">

      <GcdsHeading tag="h3" marginTop='300'>{pageContent['10']}</GcdsHeading>
      <GcdsText>{pageContent['11']}</GcdsText>

      <GcdsGrid columns="1fr auto" className="gridInline">
        <DisplayPhoneNumbers phoneNumbers={phoneNumbers} />

        <GcdsLink href="#" size="regular">
          {pageContent['5']}
        </GcdsLink>
      </GcdsGrid>

      <gcds-grid columns="auto auto" className="verifiedBadge verifiedBadgeBottom">
        <gcds-icon name="check" className="verifiedIcon" size="sm" />
        <gcds-text className="verifiedText">
          {pageContent['9']}
        </gcds-text>
      </gcds-grid>
    </div>
  )
}

export default function ProfileHome() {
  const { language } = useParams();
  const pageContent = getPageContent(language, PAGES.ProfileHome);
  const { state } = useUser();
  const name = state?.userProfile?.name.formatted || "";
  const email = state?.userProfile?.userName || "";
  const phoneNumbers = state?.userProfile?.phoneNumbers;



  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContent['1']}</GcdsHeading>
      <GcdsHeading tag="h2">{pageContent['2']}</GcdsHeading>

      <gcds-container className="sectionCard">
        <GcdsHeading tag="h6" marginTop='300'>{pageContent['3']}</GcdsHeading>
        <GcdsGrid columns="1fr auto" className="gridInline">
          <GcdsText>{name}</GcdsText>
          <GcdsLink href="#" size="regular">
            {pageContent['5']}
          </GcdsLink>
        </GcdsGrid>
      </gcds-container>

      <GcdsHeading tag="h2" marginTop='300'>{pageContent['6']}</GcdsHeading>
      <gcds-container className="sectionCard">
        <GcdsHeading tag="h3" marginTop='300'>{pageContent['7']}</GcdsHeading>
        <GcdsText>{pageContent['8']}</GcdsText>

        <GcdsGrid columns="1fr auto" className="gridInline">
          <GcdsText>{email}</GcdsText>
          <GcdsLink href="#" size="regular">
            {pageContent['5']}
          </GcdsLink>
        </GcdsGrid>

        <gcds-grid columns="auto auto" className="verifiedBadge">
          <gcds-icon name="check" className="verifiedIcon" size="sm" />
          <gcds-text className="verifiedText">
            {pageContent['9']}
          </gcds-text>
        </gcds-grid>
        {
          phoneNumbers != null ? <ContactPhoneNumber pageContent={pageContent} phoneNumbers={phoneNumbers} /> : null
        }

      </gcds-container>

      <GcdsHeading tag="h2">{pageContent['12']}</GcdsHeading>
      <gcds-container className="sectionCard">
        <GcdsHeading tag="h3" marginTop='300'>{pageContent['13']}</GcdsHeading>
        <GcdsGrid columns="1fr auto" className="gridInline">
          <GcdsText>{pageContent['14']}</GcdsText>
          <GcdsLink href="#" size="regular">
            {pageContent['5']}
          </GcdsLink>
        </GcdsGrid>

        <div className="separator" />

        <GcdsHeading tag="h3" marginTop='300'>{pageContent['15']}</GcdsHeading>
        <GcdsText>{pageContent['16']}</GcdsText>
        <GcdsText>{pageContent['17']}</GcdsText>
      </gcds-container>
    </GcdsContainer>
  );
}
