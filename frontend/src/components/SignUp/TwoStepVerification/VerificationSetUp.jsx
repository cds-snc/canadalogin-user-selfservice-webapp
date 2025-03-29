import {
    GcdsContainer, GcdsDetails, GcdsFieldset, GcdsHeading,
    GcdsLink, GcdsRadioGroup,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {getPageContent} from '../../../utils/functions';
import AlreadyGc from "../../Layout/AlreadyGc.jsx";
import {countryMapping, NAVIGATION_LINKS} from "../../../utils/constants.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import { useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import fr from 'react-phone-input-2/lang/es.json';
import VerificationSetUpInfoEng from "./VerificationSetUpInfo.jsx";
import VerificationSetUpInfo from "./VerificationSetUpInfo.jsx";

export default function RegisterVerification({currentLang}) {
    const pageContentJson = getPageContent(currentLang, "VerificationSetUp");
    const [phone, setPhone] = useState('');
    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                <GcdsContainer className="gcds-gap" >
                    <GcdsStepper currentStep="3" totalSteps="5"
                                 tag="h1"
                                 lang={currentLang}>
                        {pageContentJson['1']}
                    </GcdsStepper>
                </GcdsContainer>
                <GcdsContainer>
                    <VerificationSetUpInfo currentLang={currentLang} pageContentJson={pageContentJson} />
                    <GcdsContainer padding="200">
                    <PhoneInput
                        inputProps={{
                            name: 'phone',
                            required: true,
                            autoFocus: true,
                        }}
                        specialLabel={pageContentJson['10']}
                        country={'ca'}
                        onlyCountries={countryMapping.countries}
                        localization={currentLang==='fr'?countryMapping.frLocalization:countryMapping.localization}
                        value={phone}
                        className={'high-res'}
                        enableSearch={true}
                        countryCodeEditable={false}
                        disableSearchIcon={false}
                        defaultErrorMessage={"Phone number is required"}
                        onChange={phone =>  setPhone(phone)}
                    />
                        <br />
                    </GcdsContainer>
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