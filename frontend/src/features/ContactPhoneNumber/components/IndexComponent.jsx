import { useState } from "react";
import { useParams, useLocation } from "react-router";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";
import {
    NAVIGATION_LINKS,
    FLOW_TYPES,
    PAGES
} from "../../../utils/constants.jsx";
import { getPageContent } from '../../../utils/functions.jsx';
import { authService } from '../../../services/authService.jsx';

import { useUser } from "../../../components/Providers/useUser.tsx";
import Loader from "../../../components/Layout/Loading.jsx";
import EnterPhoneNumber from "./EnterPhoneNumber.jsx";
import OtpVerification from "./OtpVerification.jsx";
import ConfirmUpdate from "./ConfirmUpdate.jsx";
import SuccessfullyUpdated from "./SuccessfullyUpdated.jsx";
import { transientOtp } from "../api/transientOtp.jsx";


const STEPS = {
    ENTER: 'enterPhoneNumber',
    VERIFY: 'otpVerification',
    CONFIRM: 'confirm',
    SUCCESS: 'success',
};

// Map frontend FLOW_TYPES to backend otpType
// Backend: sms | voice
// Frontnd: smsotp | voiceotp
// IBM Verify seems to use both smsotp | voiceotp and sms | voice
const serverMapping = {
    [FLOW_TYPES.sms]: "sms",
    [FLOW_TYPES.voice]: "voice"
};



export default function UpdateContactPhoneNumber() {
    const { language } = useParams();
    const { state } = useUser();
    const [errorCode, setErrorCode] = useState("");

    const { userProfile } = state;
    const { id, userName } = userProfile ?? {};

    const { pathname } = useLocation();
    const [localLoading, setLocalLoading] = useState(false);

    const [step, setStep] = useState(STEPS.ENTER);
    const loadingMessage = getPageContent(language, PAGES.otpSelection);

    const [phoneFormData, setPhoneFormData] = useState({
        'phoneNumber': '',
        'otp': '',
        'trxid': '',
        'contactType': FLOW_TYPES.sms,
        'formattedPhoneNumber': ''
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

    const sendOTP = async () => {
        try {
            setLocalLoading(true);
            const formdata = {
                "phoneNumber": phoneFormData.phoneNumber,
                "userName": userName,
                "otpType": serverMapping[phoneFormData.contactType]
            };

            const response = await transientOtp.sendOtp(formdata);
            if (response && response.data && response.data.trxnId) {
                handlePhoneForm('trxnId', response.data.trxnId);
                setStep(STEPS.VERIFY);
            }

        } catch (error) {
            if (error && error.data && error.data.message) {
                setErrorCode(error.data.message);
            }
        } finally {
            setLocalLoading(false);
        }
    };

    const verifyOtp = async () => {
        try {
            setLocalLoading(true);
            const formdata = {
                "otp": phoneFormData.otp,
                "trxnId": phoneFormData.trxnId,
                "otpType": serverMapping[phoneFormData.contactType]
            };

            const response = await transientOtp.verifyOtp(formdata);
            if (response && response.success) {
                setStep(STEPS.CONFIRM);
            }

        } catch (error) {
            if (error && error.data && error.data.message) {
                setErrorCode(error.data.message);
            }
        } finally {
            setLocalLoading(false);
        }
    };

    const updateProfile = async () => {
        try {
            setLocalLoading(true);
            const formdata = {
                "userName": userName,
                "phoneNumbers": [{ value: phoneFormData.phoneNumber, type: "mobile" }],
            };

            const response = await authService.update_my_user_profile(formdata);
            if (response && response.success) {
                setStep(STEPS.SUCCESS);
            }

        } catch (error) {
            if (error && error.data && error.data.message) {
                setErrorCode(error.data.message);
            }
        } finally {
            setLocalLoading(false);
        }
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
                errorCode={errorCode}
                onNext={() => {
                    sendOTP();
                }}
                onCancel={
                    () => {
                        navigateHelper(backtoProfile);
                    }
                }
            />
        ),
        otpVerification: (
            <OtpVerification
                userProfile={userProfile}
                phoneFormData={phoneFormData}
                onChangePhoneForm={handlePhoneForm}
                errorCode={errorCode}
                step={2}
                totalSteps={3}
                onNext={
                    () => {
                        verifyOtp();
                    }
                }
                onCancel={
                    () => {
                        navigateHelper(backtoProfile);
                    }
                }
                onBack={
                    () => {
                        setStep(STEPS.ENTER);
                    }
                }
            />
        ),
        confirm: (
            <ConfirmUpdate
                userProfile={userProfile}
                phoneFormData={phoneFormData}
                onChangePhoneForm={handlePhoneForm}
                step={3}
                totalSteps={3}
                onNext={() => {
                    updateProfile();
                }}
                onCancel={
                    () => {
                        navigateHelper(backtoProfile);
                    }
                }
            />
        ),
        success: (
            <SuccessfullyUpdated
                userProfile={userProfile}
                phoneFormData={phoneFormData}
                onNext={() => {
                    navigateHelper(backtoProfile);
                }}
                onCancel={
                    () => {
                        navigateHelper(backtoProfile);
                    }
                }
            />
        ),
    };

    console.log('phoneForm', phoneFormData)
    console.log('localLoading', localLoading)

    return localLoading
        ? <Loader text={loadingMessage['11']} />
        : steps[step];
}