import React from 'react';
import {
    GcdsButton,
    GcdsContainer,
    GcdsHeading,
    GcdsInput,
    GcdsDetails,
    GcdsText
} from '@cdssnc/gcds-components-react';
import { useParams } from 'react-router';
import { getPageContent } from '../../utils/functions';
import { PAGES } from '../../utils/constants';
import SubmitButton from '../Layout/SubmitButton';

export default function ProfileNameEdit() {
    const { language } = useParams();
    const pageNameEditJson = getPageContent(language, PAGES.ProfileNameEdit);

    return (
        <GcdsContainer>
            <GcdsHeading tag="h1">
                {pageNameEditJson['5']}
            </GcdsHeading>

            <GcdsText>
                {pageNameEditJson['6']}<strong>
                    {pageNameEditJson['7']}</strong>
            </GcdsText>

            <GcdsDetails detailsTitle={pageNameEditJson['1']} />

            <form id="form" style={{ marginTop: '38px' }}>
                <GcdsContainer marginTop="100" marginBottom="0">
                    <GcdsInput
                        inputId="firstName"
                        label={pageNameEditJson['2']}
                        name="firstName"
                        type="text"
                        validateOn="other"
                        data-testid="firstName"
                        lang={language}
                    />
                    <GcdsInput
                        inputId="lastName"
                        label={pageNameEditJson['3']}
                        name="lastName"
                        type="text"
                        validateOn="other"
                        data-testid="lastName"
                        lang={language}
                        required
                    />
                    <SubmitButton currentLang={language} disabled={false} />{' '}
                    <GcdsButton buttonRole="secondary">
                        {pageNameEditJson['4']}
                    </GcdsButton>
                </GcdsContainer>
            </form>
        </GcdsContainer>
    );
}
