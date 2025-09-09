import { useState } from "react";
import { useParams, useLocation } from "react-router";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";
import {
    NAVIGATION_LINKS
} from "../../../utils/constants.jsx";
import { useUser } from "../../../components/Providers/useUser.tsx";
import EnterPhoneNumber from "./EnterPhoneNumber.jsx";

const STEPS = {
    ENTER: 'enterPhoneNumber',
    VERIFY: 'verify',
    CONFIRM: 'confirm',
};

const MFAMETHOD = {
    SMS: 'sms',
    VOICE: 'voice'
};



export default function UpdateContactPhoneNumber() {
    const { language } = useParams();
    const { state } = useUser();
    const { userProfile } = state;
    const { id } = userProfile ?? {};

    const { pathname } = useLocation();
    const [localLoading, setLocalLoading] = useState(false);

    const [step, setStep] = useState(STEPS.ENTER);
    const [phoneFormData, setPhoneFormData] = useState({
        'phoneNumber': '',
        'otp': '',
        'trxid': '',
        'contactType': MFAMETHOD.SMS
    });

    const [otpValidationResponse, setOtpValidationResponse] = useState(null);
    const [userOtpValue, setUserOtpValue] = useState("");

    const navigateHelper = useNavigateHelper();
    const backtoProfile = `/${language}${NAVIGATION_LINKS.profileHome}`;

    const handleLoading = (bool) => {
        setLocalLoading(bool)
    };

    const handleOtpSentResponse = (otpResponse) => {
        setOtpValidationResponse(otpResponse);
    };

    const handleSetUserOtpValue = (userOtpValue) => {
        setUserOtpValue(userOtpValue);
    };

    const handlePhoneForm = (field, value) => {
        setPhoneFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const steps = {
        enterPhoneNumber: (
            <EnterPhoneNumber
                userProfile={userProfile}
                phoneFormData={phoneFormData}
                onChangePhoneForm={handlePhoneForm}
                step={1}
                totalSteps={3}
                onNext={() => {
                    setStep("verify");
                }}
                onCancel={
                    () => {
                        navigateHelper(backtoProfile);
                    }
                }
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

    console.log('phoneForm', phoneFormData)
    return (
        <>
            {
                steps[step]
            }
        </>
    )
}