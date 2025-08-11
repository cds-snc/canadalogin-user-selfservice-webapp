import React from 'react';
import { useParams } from 'react-router';
import { format } from 'date-fns';
import { getPageContent } from '../../utils/functions.jsx';
import { PAGES } from '../../utils/constants.jsx';
import {
    GcdsContainer,
    GcdsHeading,
    GcdsGrid,
    GcdsText,
    GcdsLink,
} from '@cdssnc/gcds-components-react';
import { useUser } from "../Providers/useUser.tsx";



export default function SecuritySettings() {
    const { language } = useParams();
    const pageContent = getPageContent(language, PAGES.securitySettings);
    const { state } = useUser();
    const lastPasswordChange = state?.userProfile?.details?.pwdChangedTime || "";
    const formattedPasswordChangeDate = format(new Date(lastPasswordChange), 'MMMM d, yyyy');
    return (
        <GcdsContainer>
            <GcdsHeading tag="h1">{pageContent['1']}</GcdsHeading>
            <GcdsHeading tag="h2">{pageContent['2']}</GcdsHeading>
            <GcdsText>{pageContent['3']}</GcdsText>
            <GcdsContainer className="sectionCard">
                <GcdsHeading tag="h3">{pageContent['4']}</GcdsHeading>
                <GcdsGrid columns="1fr" gap="1rem" align-items="center">
                    <GcdsText>{pageContent['5']} {formattedPasswordChangeDate}</GcdsText>
                    <GcdsLink href="#" size="regular">
                        {pageContent['6']}
                    </GcdsLink>
                </GcdsGrid>
            </GcdsContainer>

            <GcdsContainer className="sectionCard">
                <GcdsHeading tag="h3" marginTop='300'>{pageContent['7']}</GcdsHeading>
                <GcdsText>{pageContent['8']}</GcdsText>

                <GcdsGrid columns="1fr" gap="1rem" align-items="center">
                    <GcdsText >
                        <div className='verifiedIconBadge'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="17" viewBox="0 0 13 17" fill="none">
                                <path d="M5.28125 11.0472H7.71875L7.25156 8.42693C7.5224 8.29151 7.73568 8.09516 7.89141 7.83787C8.04714 7.58057 8.125 7.2962 8.125 6.98474C8.125 6.53787 7.96589 6.15531 7.64766 5.83708C7.32943 5.51886 6.94687 5.35974 6.5 5.35974C6.05312 5.35974 5.67057 5.51886 5.35234 5.83708C5.03411 6.15531 4.875 6.53787 4.875 6.98474C4.875 7.2962 4.95286 7.58057 5.10859 7.83787C5.26432 8.09516 5.4776 8.29151 5.74844 8.42693L5.28125 11.0472ZM6.5 16.7347C4.61771 16.2608 3.0638 15.1808 1.83828 13.4949C0.61276 11.809 0 9.93682 0 7.87849V2.92224L6.5 0.484741L13 2.92224V7.87849C13 9.93682 12.3872 11.809 11.1617 13.4949C9.9362 15.1808 8.38229 16.2608 6.5 16.7347Z" fill="#2B4380" />
                            </svg>
                            {pageContent['9']}
                        </div>
                    </GcdsText>
                    <GcdsLink href="#" size="regular">
                        {pageContent['10']}
                    </GcdsLink>
                </GcdsGrid>
            </GcdsContainer>
        </GcdsContainer>
    );
}
