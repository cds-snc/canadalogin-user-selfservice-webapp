import React from 'react';
import { GcdsContainer, GcdsHeading } from '@cdssnc/gcds-components-react';
import {
    GcdsGrid,
    GcdsText,
    GcdsLink
} from '@cdssnc/gcds-components-react';
function ProfileHome() {

    return (
        <GcdsContainer>
            <GcdsHeading tag="h1">Personal information</GcdsHeading>
            <GcdsHeading tag="h2">
                Basic information
            </GcdsHeading>
            <gcds-container className="profile-home-gcds-container">
                <GcdsHeading tag="h6">Name</GcdsHeading>
                <GcdsGrid
                    columns="1fr auto" >
                    <GcdsText >Example Name</GcdsText>
                    <GcdsLink href="#" size='regular'>Edit</GcdsLink>
                </GcdsGrid>
            </gcds-container>

            <GcdsHeading tag="h2">Contact information</GcdsHeading>
            <gcds-container>
                <GcdsText style={{ padding: '0px 20px', border: '1px solid var(--colour-gray-300, #A8ADB4)', borderRadius: '10px' }}>
                    <GcdsHeading tag="h3">Email</GcdsHeading>
                    <GcdsText>
                        This email is used for signing in and contacting you:
                    </GcdsText>
                    <GcdsGrid
                        columns="1fr auto" >
                        <GcdsText>Ex****@gmail.com</GcdsText>
                        <GcdsLink href="#" size="regular">Edit</GcdsLink>
                    </GcdsGrid>
                    <gcds-grid
                        columns="auto auto"
                        style={{
                            display: 'inline-flex',
                            background: 'var(--colour-green-100, #E6F6EC)',
                            padding: 'var(--gcds-spacing-100) var(--gcds-spacing-200)',
                            height: '32px',
                            border: '1px solid var(--colour-green-10, #E6F6EC)',
                            borderRadius: '5px' }}
                    >
                        <gcds-icon name="check" style={{color: 'var(--gcds-color-green-500)'}}/>
                        <gcds-text
                            style={{ color: 'var(--gcds-color-green-500)' }}>
                            Verified
                        </gcds-text>
                    </gcds-grid>
                    <GcdsText style={{
                        borderBottom: '1px solid #A8ADB4'
                    }}></GcdsText>
                    <GcdsHeading tag="h3">Contact phone number</GcdsHeading>
                    <GcdsText>
                        This number is used for contacting you:
                    </GcdsText>
                    <GcdsGrid
                        columns="1fr auto">
                        <GcdsText>+1 (***) ***-2839</GcdsText>
                        <GcdsLink href="#" size="regular">Edit</GcdsLink>
                    </GcdsGrid>
                    <gcds-grid
                        columns="auto auto"
                        style={{
                            display: 'inline-flex',
                            background: 'var(--colour-green-100, #E6F6EC)',
                            padding: 'var(--gcds-spacing-100) var(--gcds-spacing-200)',
                            border: '1px solid var(--colour-green-10, #E6F6EC)',
                            borderRadius: '5px',
                            height: '32px',
                        }}
                    >
                        <gcds-icon name="check" size="sm" />
                        <gcds-text
                            size="body"
                            style={{ marginLeft: 'var(--gcds-spacing-100)', color: '#03662A' }}>
                            Verified
                        </gcds-text>
                    </gcds-grid>
                </GcdsText>

                <GcdsHeading tag="h2">
                    Communication
                </GcdsHeading>
                <gcds-container style={{ padding: '0px 20px', border: '1px solid var(--colour-gray-300, #A8ADB4)', borderRadius: '10px' }}>
                    <GcdsHeading tag="h3">Language Preference</GcdsHeading>
                    <GcdsGrid
                        columns="1fr auto">
                        <GcdsText >English</GcdsText>
                        <GcdsLink href="#" size="regular">Edit</GcdsLink>
                    </GcdsGrid>
                    <GcdsText style={{
                        borderBottom: '1px solid #A8ADB4'
                    }}></GcdsText>
                    <GcdsHeading tag="h3">Notifications</GcdsHeading>
                    <GcdsText>
                        We will send account-related notifications to the email registered to your account.</GcdsText>
                    <GcdsText >
                        You may also receive notifications from services connected to your GC Sign in. You can manage those preferences in each service’s settings.
                    </GcdsText>
                </gcds-container>
            </gcds-container>
        </GcdsContainer>
    );
}

export default ProfileHome;