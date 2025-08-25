import { useEffect, useState } from "react";

import { otpFactors } from "../api/otpFactors.jsx";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";

import OtpSelection from "./OtpSelection.jsx";
import OtpVerification from "./OtpVerification.jsx";
import Password from "./Password.jsx";

import {
    NAVIGATION_LINKS
} from "../../../utils/constants.jsx";
import { useParams } from "react-router";
import { useUser } from "../../../components/Providers/useUser.tsx";

const defaulPasswordUpdatetStep = "otpSelection";

export default function ChangePasswordIndex() {
    const { language } = useParams();
    const { state } = useUser();
    const [userPhoneFactors, setUserPhoneFactors] = useState([]);

    const [otpSentResponse, setOtpSentResponse] = useState(null);
    const [userOtpValue, setUserOtpValue] = useState("");

    const [passwordUpdateStep, setPasswordUpdateStep] = useState(defaulPasswordUpdatetStep);
    const [localLoading, setLocalLoading] = useState(false);

    const [step, setStep] = useState(2);
    const { userProfile } = state;
    const { id } = userProfile ?? {};
    const [userSelectedMfaType, setUserSelectedMfaType] = useState(null);
    const navigateHelper = useNavigateHelper();
    const backToSecuritySettingsPage = `/${language}${NAVIGATION_LINKS.securitySettings}`;

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

    const handleSetUserOtpValue = (userOtpValue) => {
        setUserOtpValue(userOtpValue);
    }

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                onChangeUserMfaType={handleChangeUserMfaSelection}
                step={step}
                totalSteps={4}
                userOtpValue={userOtpValue}
                setUserOtpValue={handleSetUserOtpValue}
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
                userOtpValue={userOtpValue}
                onBack={() => setPasswordUpdateStep("otpValidation")}
            />
        ),
    };


    return (
        <>
            {
                (userSelectedMfaType) ? steps[passwordUpdateStep] : "Loading"
            }
        </>
    )
}