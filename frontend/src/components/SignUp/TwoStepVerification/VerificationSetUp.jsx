import {
    GcdsContainer, GcdsDetails, GcdsErrorSummary, GcdsFieldset, GcdsHeading, GcdsLink,
    GcdsRadioGroup,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {getPageContent} from '../../../utils/functions';
import {
    countryMapping,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
    SUBMIT_END_POINTS
} from "../../../utils/constants.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import {useState} from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import {useUser} from "../../Providers/useUser.tsx";
import {useParams} from "react-router";
import {useSubmit} from "../../../hooks/useSubmit.js";
import {useError} from "../../../hooks/useError.js";

export default function VerificationSetUp() {
    const {state} = useUser();
    const {language, flow} = useParams();
    const [phone, setPhone] = useState('');
    const [countryCodeLength, setCountryCodeLength] = useState(0);
    const pageContentJson = getPageContent(language, PAGES.verificationSetUp);
    const {setError, getError, hasErrors, clearAllErrors} = useError(language);
    const error = getError('#phone');
    const errorPageJson = getPageContent(language, PAGES.error);

    function validatePhone() {
        clearAllErrors();
        if (phone.length < countryCodeLength) {
            if (phone.length === 0)
                setError('#phone', '10');
            else
                setError('#phone', errorPageJson[8] + countryCodeLength + errorPageJson[9]);
            return false;
        }
        return true;
    }

    const submitDataOptions = {
        endpoint: SUBMIT_END_POINTS.transientOtpSend,
        navigateTo: "/" + language + "/" + FLOW_TYPES.signUp + NAVIGATION_LINKS.verification,
        type: null,
        page: PAGES.verificationSetUp,
        flow: flow,
        onError: (err)=> setError('#phone',err)
    };
    const {handleSubmit, isPending} = useSubmit(submitDataOptions, validatePhone );

    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                {
                    hasErrors()&&(<GcdsErrorSummary data-testid='errorSummary'
                                                    errorLinks={`{"#phone": "${error.errorMsg}"}`}
                                                    heading={error.heading}
                    />)
                }
                <GcdsContainer className="gcds-gap" >
                    <GcdsStepper currentStep="3" totalSteps="4"
                                 tag="h1"
                                 lang={language}>
                        {pageContentJson['1']}
                    </GcdsStepper>
                </GcdsContainer>
                <GcdsContainer>
                    <form id="form"  onSubmit={handleSubmit}>
                        <GcdsContainer>
                            <GcdsText>
                                {pageContentJson['2']}
                            </GcdsText>
                            <GcdsText>
                                <GcdsLink href={`/${language}${NAVIGATION_LINKS.signUp}`} >
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
                                <span>{pageContentJson['6']}</span> <GcdsLink href={`/${language}${NAVIGATION_LINKS.signUp}`} >{pageContentJson['7']}</GcdsLink> {pageContentJson['8']}
                            </GcdsText>
                        </GcdsContainer>
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
                            localization={language==='fr'?countryMapping.frLocalization:countryMapping.localization}
                            value={state.testData!=null?state.testData.phone:phone}
                            className={'high-res'}
                            enableSearch={true}
                            countryCodeEditable={false}
                            disableSearchIcon={false}
                            defaultErrorMessage={"Phone number is required"}
                            onChange={phone =>  setPhone(phone)}
                            isValid={(inputNumber, country) => {
                                try {setCountryCodeLength(country.format.replace(/[^.]/g, '').length);} catch(err){setError('#server', err)}
                            }}
                        />
                        <br />
                        </GcdsContainer>
                        <GcdsText>
                            <GcdsDetails detailsTitle={pageContentJson['11']}>
                                <GcdsText>
                                    <span>{pageContentJson['12']}</span>
                                </GcdsText>
                            </GcdsDetails>
                        </GcdsText>
                        <GcdsFieldset
                            fieldset-id="gcds-verification-fieldset"
                            legend={pageContentJson['14']}
                            hint={pageContentJson['15']}
                            lang={language}
                            required>
                            <br />
                            <GcdsRadioGroup
                                name="verificationType"
                                options={'['+
                                    `{"label": "${pageContentJson['16']}",`+
                                    `"id": "sms", "value": "sms","checked":"true",`+
                                    `"hint": "${pageContentJson['17']}"},`+
                                    `{"label": "${pageContentJson['18']}",`+
                                    `"id": "voice", "value": "voice",`+
                                    `"hint": "${pageContentJson['19']}"}]`}
                            />
                        </GcdsFieldset>
                        <SubmitButton currentLang={language} disabled={isPending} />
                    </form>
                </GcdsContainer>
            </GcdsContainer>
        </GcdsContainer>
    )
}