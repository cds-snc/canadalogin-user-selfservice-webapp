import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router";
import { useUser } from "../../../components/Providers/useUser.tsx";
import Loader from "../../../components/Layout/Loading.jsx";

import EnterPhoneNumber from "./EnterPhoneNumber.jsx";

// import PasswordChangedConfirmation from "./PasswordChangedConfirmation.jsx";

import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";
import {
    NAVIGATION_LINKS
} from "../../../utils/constants.jsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";

const defaultStep = "enterPhoneNumber";

export default function UpdateContactPhoneNumber() {
    const { language } = useParams();
    const { state, dispatch } = useUser();
    const { userProfile } = state;
    const { id } = userProfile ?? {};

    const { pathname } = useLocation();
    const [localLoading, setLocalLoading] = useState(false);

    const [step, setStep] = useState < 'enterPhoneNumber' | 'verify' | 'confirm' > ('enterPhoneNumber');
    const [userSelectedMFAMethod, setUserSelectedMFAMethod] = useState < 'sms' | 'voice' > ('sms');

    const [otpSentResponse, setOtpSentResponse] = useState(null);
    const [userOtpValue, setUserOtpValue] = useState("");

    const navigateHelper = useNavigateHelper();
    const backtoProfile = `/${language}${NAVIGATION_LINKS.profileHome}`;

    const handleChangeUserMfaSelection = (mfaType) => {
        setUserSelectedMFAMethod(mfaType);
    };

    const handleLoading = (bool) => {
        setLocalLoading(bool)
    };

    const handleOtpSentResponse = (otpResponse) => {
        setOtpSentResponse(otpResponse);
    };

    const handleSetUserOtpValue = (userOtpValue) => {
        setUserOtpValue(userOtpValue);
    }

    const steps = {
        enterPhoneNumber: (
            <EnterPhoneNumber
                userProfile={userProfile}
                onChangeUserMfaType={handleChangeUserMfaSelection}
                userSelectedMfaType={userSelectedMfaType}
                localLoading={localLoading}
                setLocalLoading={handleLoading}
                step={2}
                totalSteps={4}
                onNext={() => {
                    setStep("verify");
                }}
            />
        ),
        // otpValidation: (
        //     <OtpVerification
        //         userProfile={userProfile}
        //         userSelectedMfaType={userSelectedMfaType}
        //         localLoading={localLoading}
        //         setLocalLoading={handleLoading}
        //         onChangeUserMfaType={handleChangeUserMfaSelection}
        //         step={3}
        //         totalSteps={4}
        //         userOtpValue={userOtpValue}
        //         setUserOtpValue={handleSetUserOtpValue}
        //         otpSentResponse={otpSentResponse}
        //         setOtpSentResponse={handleOtpSentResponse}
        //         onNext={() => {
        //             setPasswordUpdateStep("passwordChange");
        //         }}
        //         onBack={() => setPasswordUpdateStep("otpSelection")}
        //     />
        // ),
        // passwordChange: (
        //     <Password
        //         userProfile={userProfile}
        //         step={4}
        //         userSelectedMfaType={userSelectedMfaType}
        //         localLoading={localLoading}
        //         setLocalLoading={handleLoading}
        //         totalSteps={4}
        //         otpSentResponse={otpSentResponse}
        //         userOtpValue={userOtpValue}
        //         onNext={() => {
        //             setPasswordUpdateStep("passwordChangedConfirmation");
        //         }}
        //         onBack={() => setPasswordUpdateStep("otpValidation")}
        //     />
        // ),
        // passwordChangedConfirmation: (
        //     <PasswordChangedConfirmation
        //         userProfile={userProfile}
        //         step={4}
        //         userSelectedMfaType={userSelectedMfaType}
        //         localLoading={localLoading}
        //         setLocalLoading={handleLoading}
        //         totalSteps={4}
        //         otpSentResponse={otpSentResponse}
        //         userOtpValue={userOtpValue}
        //         language={language}
        //     />
        // ),
    };


    return (
        <>
            {
                steps[passwordUpdateStep]

            }
        </>
    )
}