import { useEffect, useState, useRef } from "react";

import {
    GcdsContainer, GcdsErrorSummary, GcdsHeading, GcdsInput,
    GcdsLink, GcdsNotice,
    GcdsStepper,
    GcdsText,
    GcdsButton, GcdsGrid, GcdsErrorMessage
} from "@cdssnc/gcds-components-react";

// import { passwordUpdate } from "../api/passwordUpdate.jsx";
import { getPageContent } from '../../../utils/functions.jsx';
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";

import {
    FLOW_TYPES,
    NAVIGATION_LINKS, PAGES,
} from "../../../utils/constants.jsx";
import { useParams } from "react-router";

import { useUser } from "../../../components/Providers/useUser.tsx";

const initialTime = 10;

export default function OtpVerification({ step, totalSteps, onNext, onCancel, onBack, onChangePhoneForm, phoneFormData, userProfile, errorCode }) {
    const { language } = useParams();

    const [codeRequested, setCodeRequested] = useState(false);
    const navigateHelper = useNavigateHelper();
    // const { setError, clearAllErrors, getError, hasErrors } = useError(language);
    const [time, setTime] = useState(initialTime);
    const pageContentJson = getPageContent(language, PAGES.verification);
    const errorPageJson = getPageContent(language, PAGES.error);
    const { submit, cancel } = getPageContent(language, "Button");


    // const error = getError('#verificationCode');
    const { id, userName } = userProfile ?? {};
    const didFetch = useRef(false);
    const fetchInProgress = (bool) => {
        // in dev the component makes two requests
        // this might not be needed when its built in a production environment
        didFetch.current = bool;
    }

    const requestOtpCode = async () => {
        // try {
        //     const response = await passwordUpdate.firstStep(userName, userSelectedMfaType.type);
        //     if (response && response.success) {
        //         setOtpSentResponse(response.data);
        //     }
        // } catch (err) {
        //     if (err === 429) {
        //         setDisplayTooManyRequestsError(true);
        //     }
        //     setCodeRequested(false);
        //     console.log('err', err)
        // } finally {
        //     fetchInProgress(false);
        // }
    };

    const clearValues = () => {
        onChangePhoneForm('phoneNumber', "");
        onChangePhoneForm('formattedPhoneNumber', "");
        onChangePhoneForm('otp', "");
    };

    const validateOtpCode = async (userOtpValue) => {
        //     try {
        //         const response = await passwordUpdate.secondStep(userOtpValue, otpSentResponse.trxId);
        //         if (response && response.success) {
        //             
        //         }
        //     } catch (err) {
        //         console.log('err', err)
        //     }
        onNext();
    };

    const handleChange = (e) => {
        const value = e.target.value;
        onChangePhoneForm('otp', value);
    };

    useEffect(() => {
        if (time <= 0)
            return;

        const timer = setTimeout(() => {
            setTime((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearTimeout(timer);

    }, [time]);




    useEffect(() => {
        if (!id || didFetch.current) return;
        fetchInProgress(true);
        requestOtpCode();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const userMfaType = phoneFormData.contactType;
    const errorMessage = errorPageJson[errorCode] || "";
    // console.log(pageContentJson['22'])
    // console.log('phone', pageContentJson['1'])
    return (
        <GcdsContainer>

            {/* {codeRequested && (<GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['17']} data-testid="linkSuccess">&nbsp;</GcdsNotice>)} */}

            {
                errorMessage != "" && (
                    <GcdsErrorMessage messageId="message-props">
                        {errorMessage}
                    </GcdsErrorMessage>
                )
            }

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
                    <strong>{phoneFormData.formattedPhoneNumber}</strong>
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



                <GcdsInput
                    inputId="verificationCode"
                    label={pageContentJson['9']}
                    autofocus
                    autocomplete="one-time-code"
                    name="verificationCode"
                    type="text"
                    value={phoneFormData.otp}
                    validateOn="other"
                    errorMessage={errorMessage}
                    onGcdsInput={handleChange}
                    lang={language}
                    size="6"
                    maxlength={6}
                    minlength={6}
                // disabled={displayTooManyRequestsError}
                // required={!displayTooManyRequestsError} 
                >
                </GcdsInput>


                <GcdsGrid columns="repeat(auto-fit, minmax(200px, 200px))" align-items="center">
                    <GcdsButton disabled={phoneFormData.otp.length < 6} style={{ width: 'fit-content' }} onGcdsClick={(ev) => {
                        ev.preventDefault();
                        validateOtpCode(phoneFormData.otp)
                    }}>
                        {submit}
                    </GcdsButton>

                    <GcdsButton buttonRole="secondary" style={{ width: 'fit-content' }} onGcdsClick={(ev) => {
                        ev.preventDefault();
                        onCancel()
                    }}>
                        {cancel}
                    </GcdsButton>
                </GcdsGrid>

            </GcdsContainer>
            <GcdsHeading tag='h2'>
                {pageContentJson['10']}
            </GcdsHeading>



            <GcdsText>
                <GcdsLink onGcdsClick={() => {
                    clearValues();
                    onBack();
                }
                }>
                    {pageContentJson['21']}

                </GcdsLink>

            </GcdsText>



            <GcdsText>
                {
                    time > 0 ? (
                        <span>{pageContentJson['14']}<strong> {time} {pageContentJson['15']}</strong></span>)
                        : (
                            <GcdsLink onGcdsClick={() => {
                                requestOtpCode();
                                setCodeRequested(true);
                                setTime(initialTime);
                            }
                            }>
                                {userMfaType !== FLOW_TYPES.email ? pageContentJson['16'] : pageContentJson['26']}
                            </GcdsLink>
                        )
                }
            </GcdsText>
        </GcdsContainer>
    )
};