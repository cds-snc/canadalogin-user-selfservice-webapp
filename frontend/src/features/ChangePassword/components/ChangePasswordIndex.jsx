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

const initialTime = 10;

export default function Verification() {
    const { language } = useParams();
    const { state } = useUser();
    const [time, setTime] = useState(initialTime);

    const [passwordUpdateStep, setPasswordUpdateStep] = useState("otpSelection");

    const [localLoading, setLocalLoading] = useState(false);

    const [requestNewCode, setRequestNewCode] = useState(false);
    const [codeRequested, setCodeRequested] = useState(false);
    const [firstStepCompleted, setFirstStepCompleted] = useState(false);


    const [step, setStep] = useState(2);
    const [otpData, setOtpData] = useState(null);
    const [userOtpValue, setUserOtpValue] = useState("");
    const { userProfile } = state;
    const { details } = userProfile ?? {};
    const userDefaultMfa = details?.lastMFA?.[0]?.type ?? null;
    const [userMfaType, setUserMfaType] = useState(userDefaultMfa);
    const navigateHelper = useNavigateHelper();
    const backToSecuritySettingsPage = `/${language}${NAVIGATION_LINKS.securitySettings}`;
    // const { setError, clearAllErrors, getError, hasErrors } = useError(language);
    const pageContentJson = getPageContent(language, PAGES.verification);
    const { submit } = getPageContent(language, "Button");

    const handleChangeUserMfaSelection = (mfaType) => {
        setUserMfaType(mfaType)
    };

    const handleLoading = (bool) => {
        setLocalLoading(bool)
    };

    const steps = {
        otpSelection: (
            <OtpSelection
                userProfile={userProfile}
                onChangeUserMfaType={handleChangeUserMfaSelection}
                userMfaType={userMfaType}
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
                userMfaType={userMfaType}
                localLoading={localLoading}
                setLocalLoading={handleLoading}
                step={step}
                totalSteps={4}
                onNext={(data) => {
                    setStep(4)
                    setOtpData(data);
                    setPasswordUpdateStep("passwordChange");
                }}
                onBack={() => setPasswordUpdateStep("otpSelection")}
            />
        ),
        passwordChange: (
            <Password
                userProfile={userProfile}
                step={step}
                userMfaType={userMfaType}
                localLoading={localLoading}
                setLocalLoading={handleLoading}
                totalSteps={4}
                otpData={otpData}
                onBack={() => setPasswordUpdateStep("otpValidation")}
            />
        ),
    };


    return (
        <GcdsContainer>
            {steps[passwordUpdateStep]}
        </GcdsContainer>
    )
}