import { useEffect, useState, useRef } from "react";

import {
    GcdsContainer, GcdsErrorSummary, GcdsHeading, GcdsInput,
    GcdsLink, GcdsNotice,
    GcdsStepper,
    GcdsText,
    GcdsButton, GcdsGrid, GcdsErrorMessage
} from "@cdssnc/gcds-components-react";
import { otpFactors } from "../api/otpFactors.jsx";
import { passwordUpdate } from "../api/passwordUpdate.jsx";
import { getPageContent, isCodeValid } from '../../../utils/functions.jsx';
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";

import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES, LINK_SUBMIT_TYPES,
    NAVIGATION_LINKS, PAGES,
    SERVICES, SUBMIT_END_POINTS
} from "../../../utils/constants.jsx";
import { useParams } from "react-router";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";

import { useUser } from "../../../components/Providers/useUser.tsx";

const initialTime = 10;

export default function OtpVerification({ step, totalSteps, onNext, userProfile, userSelectedMfaType, otpSentResponse, setOtpSentResponse, setUserOtpValue, userOtpValue, onChangeUserMfaType, onBack }) {
    const { language } = useParams();
    const { state } = useUser();

    const [requestNewCode, setRequestNewCode] = useState(false);
    const [codeRequested, setCodeRequested] = useState(false);
    const [displayTooManyRequestsError, setDisplayTooManyRequestsError] = useState(false);

    const navigateHelper = useNavigateHelper();
    const backToSecuritySettingsPage = `/${language}${NAVIGATION_LINKS.securitySettings}`;
    // const { setError, clearAllErrors, getError, hasErrors } = useError(language);
    const [time, setTime] = useState(initialTime);
    const pageContentJson = getPageContent(language, PAGES.verification);
    const errorPageJson = getPageContent(language, PAGES.error);
    const { submit, cancel } = getPageContent(language, "Button");

    // const error = getError('#verificationCode');
    const { id, userName } = userProfile ?? {};


    const validateOtpCode = async (userOtpValue) => {
        try {
            const response = await passwordUpdate.secondStep(userOtpValue, otpSentResponse.trxId);
            if (response && response.success) {
                onNext(response.data);
            }
        } catch (err) {
            console.log('err', err)
        }
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setUserOtpValue(value);
    };

    useEffect(() => {
        if (time <= 0)
            return;

        const timer = setTimeout(() => {
            setTime((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearTimeout(timer);

    }, [time]);

    const didFetch = useRef(false);

    useEffect(() => {
        const requestOtpCode = async () => {
            if (didFetch.current) return;
            didFetch.current = true;
            try {
                const response = await passwordUpdate.firstStep(userName, userSelectedMfaType.type);
                if (response && response.success) {
                    setOtpSentResponse(response.data)
                }
            } catch (err) {
                if (err === 429) {
                    setDisplayTooManyRequestsError(true);
                }
                console.log('err', err)
            }
        };

        if (id) {
            requestOtpCode();
            setTime(initialTime);
            setRequestNewCode(false);
            setDisplayTooManyRequestsError(false);
        }


    }, [userName, userSelectedMfaType, requestNewCode, setOtpSentResponse, id]);

    const userMfaType = userSelectedMfaType.type;
    return (
        <GcdsContainer>

            {/* <GcdsErrorSummary
                data-testid='errorSummary'
                errorLinks={"Anohter "}
                heading="Error Message"
            /> */}
            {
                displayTooManyRequestsError && (
                    <GcdsErrorMessage messageId="message-props">
                        {errorPageJson['14']}
                    </GcdsErrorMessage>
                )
            }

            {codeRequested && (<GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['17']} data-testid="linkSuccess">&nbsp;</GcdsNotice>)}


            <GcdsContainer>

                <GcdsStepper
                    currentStep={step}
                    totalSteps={totalSteps}
                    tag="h1"
                    lang={language}>
                    {userMfaType === FLOW_TYPES.email ? pageContentJson['22'] : pageContentJson['1']}
                </GcdsStepper>

                <GcdsText>
                    {userMfaType === FLOW_TYPES.voice ? pageContentJson['3'] : userMfaType === FLOW_TYPES.sms ? pageContentJson['2'] : pageContentJson['23']}&nbsp;
                    <strong>{userSelectedMfaType.phoneNumber}</strong>
                </GcdsText>
                <GcdsText>
                    {userMfaType === FLOW_TYPES.voice ? pageContentJson['5'] : userMfaType === FLOW_TYPES.sms ? pageContentJson['4'] : pageContentJson['24']}
                </GcdsText>
                <GcdsText>
                    {pageContentJson['6']} <strong>{pageContentJson['7']}</strong>
                </GcdsText>
                {
                    userMfaType !== FLOW_TYPES.email && (
                        <GcdsHeading tag='h2'>
                            {pageContentJson['8']}
                        </GcdsHeading>
                    )
                }

                {
                    state.testData !== undefined && (<GcdsInput
                        inputId="verificationCode"
                        label={pageContentJson['9']}
                        name="verificationCode"
                        value={state.testData.otp}
                        type="text"
                        autofocus
                        validateOn="other"
                        // errorMessage={error.errorMsg}
                        lang={language}
                        size="6"
                        maxlength={6}
                        required ></GcdsInput>)
                }
                {
                    state.testData === undefined && (<GcdsInput
                        inputId="verificationCode"
                        label={pageContentJson['9']}
                        autofocus
                        name="verificationCode"
                        type="text"
                        validateOn="other"
                        // errorMessage={error.errorMsg}
                        onGcdsInput={handleChange}
                        lang={language}
                        size="6"
                        maxlength={6}
                        minlength={6}
                        disabled={displayTooManyRequestsError}
                        required={!displayTooManyRequestsError} ></GcdsInput>)
                }

                <GcdsGrid columns="repeat(auto-fit, minmax(100px, 100px))" gap="10px" align-items="center">
                    <GcdsButton disabled={userOtpValue.length < 6} style={{ width: 'fit-content' }} onGcdsClick={(ev) => {
                        ev.preventDefault();
                        validateOtpCode(userOtpValue)
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
            <GcdsHeading tag='h2'>
                {pageContentJson['10']}
            </GcdsHeading>


            <GcdsText>
                {
                    time <= 0 ? (
                        <GcdsLink onGcdsClick={() => {
                            onBack()
                        }
                        }>
                            {pageContentJson['21']}
                        </GcdsLink>
                    ) : ""
                }
            </GcdsText>


            <GcdsText>
                {
                    time > 0 ? (<span>{pageContentJson['14']}<strong> {time} {pageContentJson['15']}</strong></span>)
                        : (
                            <GcdsLink onGcdsClick={(e) => {
                                setRequestNewCode(true);
                                setCodeRequested(true);
                            }
                            }>
                                {userMfaType !== FLOW_TYPES.email ? pageContentJson['16'] : pageContentJson['26']}
                            </GcdsLink>
                        )
                }
            </GcdsText>
        </GcdsContainer>
    )
}