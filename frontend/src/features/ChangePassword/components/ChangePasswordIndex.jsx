import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router";
import { useUser } from "../../../components/Providers/useUser.tsx";
import Loader from "../../../components/Layout/Loading.jsx";

import OtpSelection from "./OtpSelection.jsx";
import OtpVerification from "./OtpVerification.jsx";
import Password from "./Password.jsx";
import PasswordChangedConfirmation from "./PasswordChangedConfirmation.jsx";

import { otpFactors } from "../api/otpFactors.jsx";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";
import {
    NAVIGATION_LINKS
} from "../../../utils/constants.jsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";

const defaulPasswordUpdatetStep = "otpSelection";

export default function ChangePasswordIndex() {
    const { language } = useParams();
    const { state, dispatch } = useUser();
    const { removeAuthenticatedPage } = userProfileDispatch(dispatch);
    const { pathname } = useLocation();

    const [userPhoneFactors, setUserPhoneFactors] = useState([]);

    const [otpSentResponse, setOtpSentResponse] = useState(null);
    const [userOtpValue, setUserOtpValue] = useState("");

    const [passwordUpdateStep, setPasswordUpdateStep] = useState(defaulPasswordUpdatetStep);
    const [localLoading, setLocalLoading] = useState(false);
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

    useEffect(() => {
        return () => {
            // when a user navigates away from this component, we remove the pathname from the array
            // In the Private Route handler, we track the page to avoid a redirect loop to reautenticate the user
            removeAuthenticatedPage(pathname);
        };
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
                step={2}
                totalSteps={4}
                onNext={() => {
                    setPasswordUpdateStep("otpValidation");
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
                step={3}
                totalSteps={4}
                userOtpValue={userOtpValue}
                setUserOtpValue={handleSetUserOtpValue}
                otpSentResponse={otpSentResponse}
                setOtpSentResponse={handleOtpSentResponse}
                onNext={() => {
                    setPasswordUpdateStep("passwordChange");
                }}
                onBack={() => setPasswordUpdateStep("otpSelection")}
            />
        ),
        passwordChange: (
            <Password
                userProfile={userProfile}
                step={4}
                userSelectedMfaType={userSelectedMfaType}
                localLoading={localLoading}
                setLocalLoading={handleLoading}
                totalSteps={4}
                otpSentResponse={otpSentResponse}
                userOtpValue={userOtpValue}
                onNext={() => {
                    setPasswordUpdateStep("passwordChangedConfirmation");
                }}
                onBack={() => setPasswordUpdateStep("otpValidation")}
            />
        ),
        passwordChangedConfirmation: (
            <PasswordChangedConfirmation
                userProfile={userProfile}
                step={4}
                userSelectedMfaType={userSelectedMfaType}
                localLoading={localLoading}
                setLocalLoading={handleLoading}
                totalSteps={4}
                otpSentResponse={otpSentResponse}
                userOtpValue={userOtpValue}
                language={language}
            />
        ),
    };


    return (
        <>
            {
                (userSelectedMfaType) ? steps[passwordUpdateStep] : <Loader text="Retrieving your Authentication Factors ..." />

            }
        </>
    )
}