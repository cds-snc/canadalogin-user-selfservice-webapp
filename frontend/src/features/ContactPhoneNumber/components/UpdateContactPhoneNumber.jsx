import { useState } from "react";
import { useParams, useLocation } from "react-router";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";
import {
    NAVIGATION_LINKS,
    FLOW_TYPES,
    PAGES
} from "../../../utils/constants.jsx";
import { getPageContent } from '../../../utils/functions.jsx';

import { useUser } from "../../../components/Providers/useUser.tsx";
import Loader from "../../../components/Layout/Loading.jsx";
import EnterPhoneNumber from "./EnterPhoneNumber.jsx";
import OtpVerification from "./OtpVerification.jsx";

const STEPS = {
    ENTER: 'enterPhoneNumber',
    VERIFY: 'otpValidation',
    CONFIRM: 'confirm',
};


export default function UpdateContactPhoneNumber() {
    const { language } = useParams();
    const { state } = useUser();
    const { userProfile } = state;
    const { id } = userProfile ?? {};

    const { pathname } = useLocation();
    const [localLoading, setLocalLoading] = useState(false);

    const [step, setStep] = useState(STEPS.ENTER);
    const loadingMessage = getPageContent(language, PAGES.otpSelection);

    const [phoneFormData, setPhoneFormData] = useState({
        'phoneNumber': '',
        'otp': '',
        'trxid': '',
        'contactType': FLOW_TYPES.sms
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
                setLocalLoading={handleLoading}
                step={1}
                totalSteps={3}
                onNext={() => {
                    setStep(STEPS.VERIFY);
                }}
                onCancel={
                    () => {
                        navigateHelper(backtoProfile);
                    }
                }
            />
        ),
        otpValidation: (
            <OtpVerification
                userProfile={userProfile}
                phoneFormData={phoneFormData}
                onChangePhoneForm={handlePhoneForm}
                step={1}
                totalSteps={3}
                onNext={() => {
                    setStep(STEPS.VERIFY);
                }}
                onCancel={
                    () => {
                        navigateHelper(backtoProfile);
                    }
                }
            />
        ),
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
    console.log('localLoading', localLoading)

    return localLoading
        ? <Loader text={loadingMessage['11']} />
        : steps[step];
}