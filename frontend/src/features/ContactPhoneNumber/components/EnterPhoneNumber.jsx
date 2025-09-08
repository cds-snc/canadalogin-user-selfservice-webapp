import { useState } from 'react';
import { useParams } from "react-router";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import {
    GcdsContainer, GcdsDetails, GcdsErrorSummary, GcdsFieldset, GcdsHeading, GcdsLink,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import { getPageContent } from '../../../utils/functions.jsx';
import {
    countryMapping,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
    SUBMIT_END_POINTS
} from "../../../utils/constants.jsx";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";


const ServicesAccessingPhoneNumber = ({ pageContentJson }) => {
    return (
        <GcdsDetails detailsTitle={pageContentJson['3']} >
            <GcdsText>
                {pageContentJson['4']}
            </GcdsText>
            <GcdsText>
                {pageContentJson['5']}
            </GcdsText>
            <GcdsText>
                {pageContentJson['6']}
            </GcdsText>
            <GcdsText>
                {pageContentJson['7']}
                <GcdsLink href="https://accounts.gc.ca/directory">{pageContentJson['8']}</GcdsLink>.
            </GcdsText>
        </GcdsDetails>
    )
};


export default function EnterPhoneNumber({ step, totalSteps, onNext, onCancel, userSelectedMfaType, onChangeUserMfaType, onChangePhoneForm, userProfile }) {
    const { language } = useParams();
    // const [phone, setPhone] = useState('');
    // const [countryCodeLength, setCountryCodeLength] = useState(0);
    const pageContentJson = getPageContent(language, PAGES.enterNewPhoneNumber);

    const errorPageJson = getPageContent(language, PAGES.error);
    const { submit, cancel } = getPageContent(language, "Button");


    return (
        <GcdsContainer>
            {/* {
                    hasErrors() && (<GcdsErrorSummary data-testid='errorSummary'
                        errorLinks={`{"#phone": "${error.errorMsg}"}`}
                        heading={error.heading}
                    />)
                } */}
            <GcdsContainer className="gcds-gap" >
                <GcdsStepper
                    currentStep={step}
                    totalSteps={totalSteps}
                    tag="h1"
                    lang={language}>
                    {pageContentJson['1']}
                </GcdsStepper>
            </GcdsContainer>
            <GcdsContainer>
                <GcdsContainer>
                    <GcdsText>
                        {pageContentJson['2']}
                    </GcdsText>

                    <ServicesAccessingPhoneNumber pageContentJson={pageContentJson} />

                    <GcdsHeading tag="h2">
                        {pageContentJson['4']}
                    </GcdsHeading>
                    <GcdsText>
                        {pageContentJson['5']}
                    </GcdsText>
                    <GcdsText>
                        <span>{pageContentJson['6']}</span> <GcdsLink href='#'> {pageContentJson['7']}</GcdsLink> {pageContentJson['8']}
                    </GcdsText>
                </GcdsContainer>
                {/* <GcdsContainer padding="200">
                        <PhoneInput
                            inputProps={{
                                name: 'phone',
                                required: true,
                                autoFocus: true,
                            }}
                            specialLabel={pageContentJson['10']}
                            country={'ca'}
                            onlyCountries={countryMapping.countries}
                            localization={language === 'fr' ? countryMapping.frLocalization : countryMapping.localization}
                            value={state.testData != null ? state.testData.phone : phone}
                            className={'high-res'}
                            enableSearch={true}
                            countryCodeEditable={false}
                            disableSearchIcon={false}
                            defaultErrorMessage={"Phone number is required"}
                            onChange={phone => setPhone(phone)}
                            isValid={(inputNumber, country) => {
                                try { setCountryCodeLength(country.format.replace(/[^.]/g, '').length); } catch (err) { setError('#server', err) }
                            }}
                        />
                        <br />
                    </GcdsContainer> */}
                {/* <GcdsText>
                        <GcdsDetails detailsTitle={pageContentJson['11']}>
                            <GcdsText>
                                <span>{pageContentJson['12']}</span>
                            </GcdsText>
                        </GcdsDetails>
                    </GcdsText> */}
                {/* <SubmitButton currentLang={language} disabled={isPending} /> */}
                {/* <GcdsGrid columns="repeat(auto-fit, minmax(100px, 100px))" gap="10px" align-items="center">
                        <GcdsButton style={{ width: 'fit-content' }} onGcdsClick={(ev) => {
                            ev.preventDefault();
                            onNext()
                        }}>
                            {submit}
                        </GcdsButton>

                        <GcdsButton buttonRole="secondary" style={{ width: 'fit-content' }} onGcdsClick={(ev) => {
                            ev.preventDefault();
                            onCancel()
                        }}>
                            {cancel}
                        </GcdsButton>
                    </GcdsGrid> */}
            </GcdsContainer>
        </GcdsContainer>
    )
}