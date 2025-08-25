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

import OtpSelection from "./OtpSelection.jsx";
import OtpVerification from "./OtpVerification.jsx";
import Password from "./Password.jsx";

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

export default function ChangePasswordIndex() {
    const { language } = useParams();
    const { state } = useUser();
    const [userPhoneFactors, setUserPhoneFactors] = useState([]);

    const [otpSentResponse, setOtpSentResponse] = useState(null);

    const [passwordUpdateStep, setPasswordUpdateStep] = useState("otpSelection");

    const [localLoading, setLocalLoading] = useState(false);

    const [requestNewCode, setRequestNewCode] = useState(false);
    const [codeRequested, setCodeRequested] = useState(false);
    const [firstStepCompleted, setFirstStepCompleted] = useState(false);

    const [step, setStep] = useState(2);
    const [userOtpValue, setUserOtpValue] = useState("");
    const { userProfile } = state;
    const { details, id } = userProfile ?? {};
    // const { lastMFA } = details ?? {};
    // const userDefaultMfa = lastMFA !== null && lastMFA.length > 0 ? lastMFA[0]?.type : null;
    const [userSelectedMfaType, setUserSelectedMfaType] = useState(null);
    const navigateHelper = useNavigateHelper();
    const backToSecuritySettingsPage = `/${language}${NAVIGATION_LINKS.securitySettings}`;
    // const { setError, clearAllErrors, getError, hasErrors } = useError(language);
    const pageContentJson = getPageContent(language, PAGES.verification);
    const { submit } = getPageContent(language, "Button");

    const handleChangeUserMfaSelection = (mfaType) => {
        const selectedMfaType = userPhoneFactors.find(factor => factor.type === mfaType);

        if (selectedMfaType.type && selectedMfaType.phoneNumber) {
            setUserSelectedMfaType(selectedMfaType);
        };
    };

    const handleLoading = (bool) => {
        setLocalLoading(bool)
    };

    const handleOtpSentResponse = (otpResponse) => {
        setOtpSentResponse(otpResponse);
    };

    useEffect(() => {

        const fetchUserOtpPhoneFactors = async () => {
            try {
                const response = await otpFactors.getUserOtpPhoneFactors(id);
                if (response && response.success && response.data.length > 0 && response.data[0].type) {
                    setUserPhoneFactors(response.data);
                    setUserSelectedMfaType(response.data[0]);
                    if (response.data.length == 1) {
                        setPasswordUpdateStep("otpValidation");
                    }
                } else {
                    navigateHelper(backToSecuritySettingsPage)
                }
            } catch (err) {
                console.log('err', err)
            }
        };

        fetchUserOtpPhoneFactors();


    }, []);


    // useEffect(() => {
    //     if (!lastMFA) return navigateHelper(backToSecuritySettingsPage)
    //     if (!lastMFA || lastMFA.length == 0) {
    //         return navigateHelper(backToSecuritySettingsPage)
    //     }
    //     if (!lastMFA || lastMFA.length == 1) {
    //         setPasswordUpdateStep("otpValidation");
    //     }
    // }, [backToSecuritySettingsPage, lastMFA, navigateHelper]);

    const steps = {
        otpSelection: (
            <OtpSelection
                userProfile={userProfile}
                userPhoneFactors={userPhoneFactors}
                onChangeUserMfaType={handleChangeUserMfaSelection}
                userSelectedMfaType={userSelectedMfaType}
                localLoading={localLoading}
                setLocalLoading={handleLoading}
                step={step}
                totalSteps={4}
                onNext={() => {
                    // set the users prefered OTP selection
                    setPasswordUpdateStep("otpValidation");
                    setStep(3)
                }}
            />
        ),
        otpValidation: (
            <OtpVerification
                userProfile={userProfile}
                userSelectedMfaType={userSelectedMfaType}
                localLoading={localLoading}
                setLocalLoading={handleLoading}
                step={step}
                totalSteps={4}
                otpSentResponse={otpSentResponse}
                setOtpSentResponse={handleOtpSentResponse}
                onNext={() => {
                    setStep(4)
                    setPasswordUpdateStep("passwordChange");
                }}
                onBack={() => setPasswordUpdateStep("otpSelection")}
            />
        ),
        passwordChange: (
            <Password
                userProfile={userProfile}
                step={step}
                userSelectedMfaType={userSelectedMfaType}
                localLoading={localLoading}
                setLocalLoading={handleLoading}
                totalSteps={4}
                otpSentResponse={otpSentResponse}
                onBack={() => setPasswordUpdateStep("otpValidation")}
            />
        ),
    };


    return (
        <GcdsContainer>
            {
                (userSelectedMfaType) ? steps[passwordUpdateStep] : "Loading"
            }

        </GcdsContainer>
    )
}