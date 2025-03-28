import {
    GcdsContainer, GcdsDetails, GcdsFieldset, GcdsHeading, GcdsInput,
    GcdsLink, GcdsRadioGroup, GcdsSelect,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {getPageContent} from '../../../utils/functions';
import AlreadyGc from "../../Layout/AlreadyGc.jsx";
import {NAVIGATION_LINKS} from "../../../utils/constants.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import { useState } from 'react';
import {
    PhoneInput,
    defaultCountries,
    FlagImage,
    parseCountry,
    usePhoneInput
} from 'react-international-phone';
import 'react-international-phone/style.css';



const countries = defaultCountries.filter((country) => {
    const { iso2 } = parseCountry(country);
    return ['ca', 'us', 'gb' ].includes(iso2);
});

export default function RegisterVerification({currentLang}) {
    const pageContentJson = getPageContent(currentLang, "VerificationSetUp");
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('');
    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                <GcdsContainer className="gcds-gap" >
                    <GcdsStepper currentStep="3" totalSteps="5"
                                 tag="h1"  >
                        {pageContentJson['1']}
                    </GcdsStepper>
                </GcdsContainer>
                <GcdsContainer>
                    <GcdsText>
                        {pageContentJson['2']}
                    </GcdsText>
                    <GcdsText>
                        <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >
                            {pageContentJson['3']}
                        </GcdsLink>
                    </GcdsText>
                    <GcdsHeading tag="h2">
                        {pageContentJson['4']}
                    </GcdsHeading>
                    <GcdsText>
                        {pageContentJson['5']}
                    </GcdsText>
                    <GcdsText>
                        {pageContentJson['6']}&nbsp;
                        <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >
                            {pageContentJson['7']}
                        </GcdsLink>
                        &nbsp;{pageContentJson['8']}
                    </GcdsText>
                    {// Need to customize the phone dropdown and input.
                         }
                    <PhoneInput
                        label="test"
                        defaultCountry="ca"
                        value={phone}
                        onChange={(phone) => setPhone(phone)}
                        countries={countries}
                        forceDialCode={true}
                    />
                    <GcdsText>
                        <GcdsDetails detailsTitle={pageContentJson['11']}>
                            <GcdsText>
                                {pageContentJson['12']}&nbsp;
                                <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >
                                    {pageContentJson['13']}
                                </GcdsLink>
                            </GcdsText>
                        </GcdsDetails>
                    </GcdsText>
                    <GcdsFieldset
                        fieldset-id="gcds-verification-fieldset"
                        legend={pageContentJson['14']}
                        hint={pageContentJson['15']}
                        required>
                        <br />
                        <GcdsRadioGroup
                            name="codeType"
                            options={'['+
                                `{"label": "${pageContentJson['16']}",`+
                                `"id": "sms", "value": "sms","checked":"true",`+
                                `"hint": "${pageContentJson['17']}"},`+
                                `{"label": "${pageContentJson['18']}",`+
                                `"id": "voice", "value": "voice",`+
                                `"hint": "${pageContentJson['19']}"}]`}
                        />
                    </GcdsFieldset>
                    <SubmitButton currentLang={currentLang}  />
                </GcdsContainer>
            </GcdsContainer>
            <AlreadyGc currentLang={currentLang}/>
        </GcdsContainer>
    )
}