import { useEffect, useState } from "react";

import {
    GcdsContainer, GcdsErrorSummary, GcdsHeading, GcdsInput,
    GcdsLink, GcdsNotice,
    GcdsStepper,
    GcdsText,
    GcdsButton, GcdsGrid
} from "@cdssnc/gcds-components-react";
import { otpFactors } from "../api/otpFactors.jsx";
import { passwordUpdate } from "../api/passwordUpdate.jsx";
import { getPageContent, isCodeValid } from '../../../utils/functions.jsx';
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";

import AlreadyGc from "../../../components/Layout/AlreadyGc.jsx";
import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES, LINK_SUBMIT_TYPES,
    NAVIGATION_LINKS, PAGES,
    SERVICES, SUBMIT_END_POINTS
} from "../../../utils/constants.jsx";
import { useParams } from "react-router";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";

import { useUser } from "../../../components/Providers/useUser.tsx";
// import { useLinkSubmit } from "../../hooks/useLinkSubmit.js";
// import { useSubmit } from "../../hooks/useSubmit";
// import { useError } from "../../hooks/useError";

const initialTime = 10;

export default function Verification() {
    const { language } = useParams();
    const { state } = useUser();
    const [userPhonenumber, setUserPhonenumber] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    const [requestNewCode, setRequestNewCode] = useState(false);
    const [codeRequested, setCodeRequested] = useState(false);
    const [firstStepCompleted, setFirstStepCompleted] = useState(false);
    const [otpData, setOtpData] = useState(null);
    const [userOtpValue, setUserOtpValue] = useState("");

    const navigateHelper = useNavigateHelper();
    const backToSecuritySettingsPage = `/${language}${NAVIGATION_LINKS.securitySettings}`;
    // const { setError, clearAllErrors, getError, hasErrors } = useError(language);
    const [time, setTime] = useState(initialTime);
    const pageContentJson = getPageContent(language, PAGES.verification);
    const { submit } = getPageContent(language, "Button");

    // const error = getError('#verificationCode');
    const { details, id, userName } = state.userProfile ?? {};
    const userDefaultMfa = details?.lastMFA?.[0]?.type ?? null;
    const type = userDefaultMfa
    console.log('state', state)
    console.log('userDefaultMfa', userDefaultMfa)

    const validateOtpCode = async (userOtpValue) => {
        try {
            const response = await passwordUpdate.secondStep(userOtpValue, otpData.trxId);
            if (response && response.success) {
                setOtpData(response.data)
                setFirstStepCompleted(true);
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

    useEffect(() => {

        const fetchUserOtpPhonenumber = async () => {
            try {
                const response = await otpFactors.getUserOtpNumber(id, userDefaultMfa);
                if (response && response.success) {
                    setUserPhonenumber(response.data.phoneNumber);
                }
            } catch (err) {
                console.log('err', err)
            }
        };

        fetchUserOtpPhonenumber();


    }, [id, userDefaultMfa]);

    useEffect(() => {
        const requestOtpCode = async () => {
            try {
                const response = await passwordUpdate.firstStep(userName, type);
                if (response && response.success) {
                    setOtpData(response.data)
                }
            } catch (err) {
                console.log('err', err)
            }
        };

        requestOtpCode();
        setTime(initialTime);
        setRequestNewCode(false);
    }, [userName, type, requestNewCode]);



    // function validateCode(code) {
    //     clearAllErrors();
    //     if (!isCodeValid(code)) {
    //         setError('#verificationCode', '3');
    //         return false;
    //     }
    //     return true;
    // }

    return (
        <GcdsContainer>

            {/* <GcdsErrorSummary
                data-testid='errorSummary'
                errorLinks={"Anohter "}
                heading="Error Message"
            /> */}

            {codeRequested && (<GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['17']} data-testid="linkSuccess">&nbsp;</GcdsNotice>)}


            <GcdsContainer>

                <GcdsStepper currentStep={'2'}
                    totalSteps="3"
                    tag="h1"
                    lang={language}>
                    {type === FLOW_TYPES.email ? pageContentJson['22'] : pageContentJson['1']}
                </GcdsStepper>

                <GcdsText>
                    {type === FLOW_TYPES.voice ? pageContentJson['3'] : type === FLOW_TYPES.sms ? pageContentJson['2'] : pageContentJson['23']}&nbsp;
                    <strong>{userPhonenumber}</strong>
                </GcdsText>
                <GcdsText>
                    {type === FLOW_TYPES.voice ? pageContentJson['5'] : type === FLOW_TYPES.sms ? pageContentJson['4'] : pageContentJson['24']}
                </GcdsText>
                <GcdsText>
                    {pageContentJson['6']} <strong>{pageContentJson['7']}</strong>
                </GcdsText>
                {
                    type !== FLOW_TYPES.email && (
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
                        required ></GcdsInput>)
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
                        {pageContentJson["27"]}
                    </GcdsButton>
                </GcdsGrid>

            </GcdsContainer>
            <GcdsHeading tag='h2'>
                {pageContentJson['10']}
            </GcdsHeading>

            {/* {
                <GcdsText>
                    {time <= 0 ? (<GcdsLink href="#" onClick={() => {
                        // clearAllErrors();
                        // handleLinkSubmit(LINK_SUBMIT_TYPES.requestNewCode, true).then(() => setTime(initialTime * timesRequested));
                        // document.getElementById("form").reset();
                    }
                    }>
                        {type === FLOW_TYPES.voice ? pageContentJson['12'] : pageContentJson['11']}
                    </GcdsLink>) : ""}
                </GcdsText>

            } */}
            <GcdsText>
                {time > 0 ? (<span>{pageContentJson['14']}<strong> {time} {pageContentJson['15']}</strong></span>)
                    : (<GcdsLink onGcdsClick={(e) => {
                        console.log('e', e)
                        setRequestNewCode(true);
                        setCodeRequested(true);
                        // handleLinkSubmit(LINK_SUBMIT_TYPES.requestNewCode, false).then(() => setTime(initialTime * timesRequested));
                        // document.getElementById("form").reset();
                    }
                    }>
                        {type !== FLOW_TYPES.email ? pageContentJson['16'] : pageContentJson['26']}
                    </GcdsLink>)}
            </GcdsText>
        </GcdsContainer>
    )
}