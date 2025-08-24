import { useParams } from "react-router";
import { useState } from 'react';
import {
    GcdsContainer, GcdsDetails, GcdsErrorSummary, GcdsRadios, GcdsHeading, GcdsLink, GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";
import { useUser } from "../../../components/Providers/useUser.tsx";

import { getPageContent } from '../../../utils/functions.jsx';
import { gcHelpCentreLinks } from '../../../utils/gcHelpCentreLinks.jsx';

import {
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
    SUBMIT_END_POINTS
} from "../../../utils/constants.jsx";


export default function OtpSelection({ step, totalSteps, onNext, userProfile, userMfaType, onChangeUserMfaType }) {
    const { language, flow } = useParams();
    const [phone, setPhone] = useState('');
    const pageContentJson = getPageContent(language, PAGES.otpSelection);
    console.log('userMfaType == FLOW_TYPES.sms', userMfaType == FLOW_TYPES.voice)

    const smsOtpRadioOption = { "label": pageContentJson['7'], "id": FLOW_TYPES.sms, "value": FLOW_TYPES.sms, "hint": pageContentJson['8'], checked: userMfaType == FLOW_TYPES.sms };
    const voiceOtpRadioOption = { "label": pageContentJson['9'], "id": FLOW_TYPES.voice, "value": FLOW_TYPES.voice, "hint": pageContentJson['10'], checked: userMfaType == FLOW_TYPES.voice };
    const radioOptions = [smsOtpRadioOption, voiceOtpRadioOption]

    return (
        <GcdsContainer>
            <GcdsContainer className="gcds-gap" >
                <GcdsStepper currentStep={step} totalSteps={totalSteps}
                    tag="h1"
                    lang={language}>
                    {pageContentJson['1']}
                </GcdsStepper>
            </GcdsContainer>
            <GcdsContainer>
                <GcdsContainer>
                    <GcdsText>
                        {pageContentJson['4']}
                    </GcdsText>
                    <GcdsText>
                        <GcdsLink
                            href={gcHelpCentreLinks.twoStepVerification}
                            target="_blank"
                        >
                            {pageContentJson['3']}
                        </GcdsLink>
                    </GcdsText>
                    {/* <GcdsHeading tag="h6"> daf
                        {pageContentJson['5']}
                    </GcdsHeading> */}
                    {/* <GcdsText>
                        <span>{pageContentJson['6']}</span> <GcdsLink href='#'> {pageContentJson['7']}</GcdsLink> {pageContentJson['8']}
                    </GcdsText> */}
                </GcdsContainer>


                <GcdsRadios
                    name="radio"
                    legend={pageContentJson['5']}
                    hint={pageContentJson['6']}
                    options={radioOptions}
                    onGcdsChange={(e) => onChangeUserMfaType(e.target.value)}
                >
                </GcdsRadios>
                <SubmitButton currentLang={language} />
            </GcdsContainer>
        </GcdsContainer>
    )
}