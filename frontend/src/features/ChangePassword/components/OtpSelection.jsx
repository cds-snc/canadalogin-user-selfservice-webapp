import { useParams } from "react-router";
import { useState } from 'react';
import {
    GcdsContainer, GcdsDetails, GcdsErrorSummary, GcdsRadios, GcdsHeading, GcdsLink, GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";
import { useUser } from "../../../components/Providers/useUser.tsx";
// import { useSubmit } from "../../../hooks/useSubmit.js";
// import { useError } from "../../../hooks/useError.js";
import { getPageContent } from '../../../utils/functions.jsx';
import { gcHelpCentreLinks } from '../../../utils/gcHelpCentreLinks.jsx';

import {
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
    SUBMIT_END_POINTS
} from "../../../utils/constants.jsx";


export default function VerificationSetUp() {
    const { state } = useUser();
    const { language, flow } = useParams();
    const [phone, setPhone] = useState('');
    const pageContentJson = getPageContent(language, PAGES.updatePassword);
    // const { setError, getError, hasErrors, clearAllErrors } = useError(language);
    // const error = getError('#phone');
    // const errorPageJson = getPageContent(language, PAGES.error);


    // const submitDataOptions = {
    //     endpoint: SUBMIT_END_POINTS.transientOtpSend,
    //     navigateTo: "/" + language + "/" + FLOW_TYPES.signUp + NAVIGATION_LINKS.verification,
    //     type: null,
    //     page: PAGES.verificationSetUp,
    //     flow: flow,
    //     onError: (err) => setError('#phone', err)
    // };
    // const { handleSubmit, isPending } = useSubmit(submitDataOptions);
    const smsOtp = "smsOtp";
    const voiceOtp = "voiceotp";

    const smsOtpRadioOption = { "label": pageContentJson['7'], "id": smsOtp, "value": smsOtp, "hint": pageContentJson['8'], checked: true };
    const voiceOtpRadioOption = { "label": pageContentJson['9'], "id": voiceOtp, "value": voiceOtp, "hint": pageContentJson['10'], checked: true };
    const radioOptions = [smsOtpRadioOption, voiceOtpRadioOption]
    console.log(JSON.stringify(radioOptions))
    return (
        <GcdsContainer>
            <GcdsContainer>

                <GcdsContainer className="gcds-gap" >
                    <GcdsStepper currentStep="2" totalSteps="3"
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
                        {/* <GcdsHeading tag="h6">
                            {pageContentJson['5']}
                        </GcdsHeading>
                        <GcdsText>
                            <span>{pageContentJson['6']}</span> <GcdsLink href='#'> {pageContentJson['7']}</GcdsLink> {pageContentJson['8']}
                        </GcdsText> */}
                    </GcdsContainer>


                    <GcdsRadios
                        name="radio"
                        legend={pageContentJson['5']}
                        hint={pageContentJson['6']}
                        options={radioOptions}
                    >
                    </GcdsRadios>
                    <SubmitButton currentLang={language} />
                </GcdsContainer>
            </GcdsContainer>
        </GcdsContainer>
    )
}