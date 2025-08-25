import { useParams } from "react-router";
import {
    GcdsContainer, GcdsRadios, GcdsLink, GcdsStepper,
    GcdsText, GcdsGrid, GcdsButton
} from "@cdssnc/gcds-components-react";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";

import { getPageContent } from '../../../utils/functions.jsx';
import { gcHelpCentreLinks } from '../../../utils/gcHelpCentreLinks.jsx';

import {
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
} from "../../../utils/constants.jsx";


export default function OtpSelection({ step, totalSteps, onNext, userSelectedMfaType, onChangeUserMfaType, userPhoneFactors }) {
    const { language } = useParams();
    const navigateHelper = useNavigateHelper();

    const pageContentJson = getPageContent(language, PAGES.otpSelection);

    const { submit, cancel } = getPageContent(language, "Button");
    const backToSecuritySettingsPage = `/${language}${NAVIGATION_LINKS.securitySettings}`;

    const configureRadioOptions = () => {
        const smsPhoneFactorValue = userPhoneFactors.find(factor => factor.type === FLOW_TYPES.sms);
        const voicePhoneFactorValue = userPhoneFactors.find(factor => factor.type === FLOW_TYPES.voice);

        const smsLabel = `${pageContentJson['7']} ${smsPhoneFactorValue.phoneNumber}`;
        const voiceLabel = `${pageContentJson['9']} ${voicePhoneFactorValue.phoneNumber}`;

        const smsOtpRadioOption = { "label": smsLabel, "id": FLOW_TYPES.sms, "value": FLOW_TYPES.sms, "hint": pageContentJson['8'], checked: userSelectedMfaType.type == FLOW_TYPES.sms };
        const voiceOtpRadioOption = { "label": voiceLabel, "id": FLOW_TYPES.voice, "value": FLOW_TYPES.voice, "hint": pageContentJson['10'], checked: userSelectedMfaType.type == FLOW_TYPES.voice };
        const radioOptions = [smsOtpRadioOption, voiceOtpRadioOption]

        return radioOptions;
    };

    const radioOptions = configureRadioOptions();

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
                </GcdsContainer>


                <GcdsRadios
                    name="radio"
                    legend={pageContentJson['5']}
                    options={radioOptions}
                    onGcdsChange={(e) => onChangeUserMfaType(e.target.value)}
                >
                </GcdsRadios>
                <GcdsGrid columns="repeat(auto-fit, minmax(100px, 100px))" gap="10px" align-items="center">
                    <GcdsButton style={{ width: 'fit-content' }} onGcdsClick={(ev) => {
                        ev.preventDefault();
                        onNext()
                    }}>
                        {submit}
                    </GcdsButton>

                    <GcdsButton buttonRole="secondary" style={{ width: 'fit-content' }} onGcdsClick={(ev) => {
                        ev.preventDefault();
                        navigateHelper(backToSecuritySettingsPage)
                    }}>
                        {cancel}
                    </GcdsButton>
                </GcdsGrid>
            </GcdsContainer>
        </GcdsContainer>
    )
}