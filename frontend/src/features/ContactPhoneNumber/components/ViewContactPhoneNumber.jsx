import { useParams } from 'react-router';
import {
    GcdsContainer,
    GcdsHeading,
    GcdsGrid,
    GcdsText,
    GcdsLink,
    GcdsButton
} from '@cdssnc/gcds-components-react';
import parsePhoneNumberFromString from 'libphonenumber-js';

import { getPageContent, capitalizeFirstLetter } from '../../../utils/functions.jsx';
import { PAGES, NAVIGATION_LINKS, LANGUAGE_DISPLAY_NAMES } from '../../../utils/constants.jsx';
import { useUser } from "../../../components/Providers/useUser.tsx";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";

const DisplayVerifiedBadge = ({ pageContent }) => {

    return (
        <>
            <gcds-grid columns="auto auto" className="verifiedBadge">
                <gcds-icon name="check" className="verifiedIcon" size="sm" />
                <gcds-text className="verifiedText">
                    {pageContent['9']}
                </gcds-text>
            </gcds-grid>
        </>
    )
}

const DisplayPhoneNumbers = ({ phoneNumbers }) => {
    console.log("phoneNumbers", phoneNumbers)

    return (
        <>

            <GcdsGrid columns="1fr">

                {
                    phoneNumbers.map((phoneNumber, index) => {
                        let profilePhoneNumber = `+${phoneNumber.value}`;
                        let numberType = capitalizeFirstLetter(phoneNumber.type)
                        const isLast = index === phoneNumbers.length - 1;

                        try {

                            const parsedPhoneNumber = parsePhoneNumberFromString(profilePhoneNumber);

                            if (parsedPhoneNumber) {
                                profilePhoneNumber = parsedPhoneNumber.formatInternational();
                            }
                        } catch (error) {
                            console.warn(`Failed to parse phone number: ${phoneNumber.value}`);
                            console.warn(`Failed to parse phone number: ${error}`);
                        }
                        return (
                            <GcdsText key={index} margin-bottom={isLast ? '400' : '0'} placeContent="center">
                                {numberType}: {profilePhoneNumber}
                            </GcdsText>
                        )

                    })
                }
            </GcdsGrid>

        </>
    )
}

const AddPhoneNumber = (props) => {
    const { pageContent } = props;
    return (
        <>

            <GcdsText>{pageContent['18']}</GcdsText>

            <GcdsGrid columns="1fr auto" className="gridInline">

                <GcdsLink href="#" size="regular">
                    Add Phone Number
                </GcdsLink>
            </GcdsGrid>
        </>
    )
};



const ContactPhoneNumber = (props) => {
    const { pageContent, phoneNumbers } = props;
    return (
        <>
            <GcdsText>{pageContent['11']}</GcdsText>

            <GcdsHeading tag="h3" marginTop='300'>{pageContent['10']}</GcdsHeading>
            <GcdsText>{pageContent['11']}</GcdsText>

            <GcdsGrid columns="1fr auto" className="gridInline">
                <DisplayPhoneNumbers phoneNumbers={phoneNumbers} />

                <GcdsLink href="#" size="regular">
                    {pageContent['5']}
                </GcdsLink>
            </GcdsGrid>

            <DisplayVerifiedBadge />
        </>
    )
}

export default function ViewContactPhoneNumber({ pageContent, phoneNumbers }) {
    const { language } = useParams();
    const { state } = useUser();
    const navigateHelper = useNavigateHelper();

    const editProfile = `/${language}${NAVIGATION_LINKS.ProfileNameEdit}`;
    const editLanguagePreferences = `/${language}${NAVIGATION_LINKS.editLanguagePreferences}`



    return (
        <GcdsContainer>
            <GcdsHeading tag="h3" marginTop='300'>{pageContent['10']}</GcdsHeading>
            <GcdsGrid columns="1fr auto" className="gridInline">
                {
                    phoneNumbers != null ? (
                        <>
                            <div className="separator" />
                            <ContactPhoneNumber pageContent={pageContent} phoneNumbers={phoneNumbers} />
                        </>
                    ) : <AddPhoneNumber pageContent={pageContent} />
                }
            </GcdsGrid>
        </GcdsContainer>
    );
}
