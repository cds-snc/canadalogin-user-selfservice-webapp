import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { getPageContent } from "../../../utils/functions.jsx";
import {
  PAGES,
  FLOW_TYPES,
  INVALID_OTP_ERROR_CODES,
} from "../../../utils/constants.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { authService } from "../../../services/authService.jsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";
import StepContent from "../../../components/Wizard/StepContent.jsx";
import Loader from "../../../components/Layout/Loading.jsx";
import EnterPhoneNumber from "./EnterPhoneNumber.jsx";
import OtpVerification from "./OtpVerification.jsx";
import ConfirmUpdate from "./ConfirmUpdate.jsx";
import SuccessfullyUpdated from "./SuccessfullyUpdated.jsx";

// Map frontend FLOW_TYPES to backend otpType
// Backend: sms | voice
// Frontend: smsotp | voiceotp
// IBM Verify seems to use both smsotp | voiceotp and sms | voice
const serverMapping = {
  [FLOW_TYPES.sms]: "sms",
  [FLOW_TYPES.voice]: "voice",
};

export default function EditContactPhoneNumberPage() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const navigate = useNavigate();

  const [wizardStep, setWizardStep] = useState("enterPhone");
  const [errorCode, setErrorCode] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [phoneFormData, setPhoneFormData] = useState({
    phoneNumber: "",
    otp: "",
    trxnId: "",
    otpType: FLOW_TYPES.sms,
    formattedPhoneNumber: "",
  });

  const loaderPageContentJson = getPageContent(language, PAGES.otpSelection);
  const errorPageJson = getPageContent(language, PAGES.error);

  const { updateProfileSuccess } = userProfileDispatch(dispatch);
  const backToProfile = path(PAGES.ProfileHome, { language: language });
  const { userProfile } = state;
  const { id } = userProfile ?? {};

  const handlePhoneFormChange = (field, value) => {
    setPhoneFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const sendOTP = async ({ reSendOtpCode = false, otpType = null } = {}) => {
    try {
      if (!reSendOtpCode) {
        setLocalLoading(true);
      }
      setErrorCode("");

      const formdata = {
        phoneNumber: phoneFormData.phoneNumber,
        user_id: id,
        otpType: serverMapping[otpType || phoneFormData.otpType],
      };

      const response = await authService.transientOtpSend(formdata);
      if (response && response.data && response.data.trxnId) {
        handlePhoneFormChange("trxnId", response.data.trxnId);
        if (!reSendOtpCode) {
          setWizardStep("verifyOtp");
        }
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
    setWizardStep("confirmUpdate");
  };

  const updateProfile = async () => {
    try {
      setLocalLoading(true);
      setErrorCode("");

      // Use the coupled OTP verification + profile update API
      const response = await authService.update_phone_with_otp(
        phoneFormData.phoneNumber,
        phoneFormData.otp,
        phoneFormData.trxnId,
        serverMapping[phoneFormData.otpType],
      );

      if (response && response.success && response.data) {
        updateProfileSuccess(response.data);
        setWizardStep("success");
      }
    } catch (error) {
      if (error && error.data && error.data.message) {
        setErrorCode(error?.data?.message);
        if (INVALID_OTP_ERROR_CODES.includes(error?.data?.message)) {
          console.log(
            "OTP validation failed during phone update:",
            error.data.message,
          );
          // If OTP is invalid, go back to OTP validation step
          setWizardStep("verifyOtp");
        }
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleBackToProfile = () => {
    navigate(backToProfile);
  };

  const handleBackToEnterPhone = () => {
    setErrorCode("");
    setWizardStep("enterPhone");
    navigate(`/${language}/profile/update-contact-phone`, { replace: true });
  };

  let errorMessage = errorPageJson[errorCode] || "";
  if (errorCode && errorMessage === "") {
    errorMessage = errorCode;
  }

  const steps = {
    enterPhone: (
      <EnterPhoneNumber
        userProfile={userProfile}
        phoneFormData={phoneFormData}
        onChangePhoneForm={handlePhoneFormChange}
        errorMessage={errorMessage}
        onNext={sendOTP}
        onCancel={handleBackToProfile}
        setErrorCode={setErrorCode}
      />
    ),
    verifyOtp: (
      <OtpVerification
        userProfile={userProfile}
        phoneFormData={phoneFormData}
        onChangePhoneForm={handlePhoneFormChange}
        errorMessage={errorMessage}
        onNext={verifyOtp}
        onCancel={handleBackToProfile}
        onBack={handleBackToEnterPhone}
        requestNewOtpCode={(otpType) =>
          sendOTP({ reSendOtpCode: true, otpType })
        }
        setErrorCode={setErrorCode}
      />
    ),
    confirmUpdate: (
      <ConfirmUpdate
        userProfile={userProfile}
        phoneFormData={phoneFormData}
        onChangePhoneForm={handlePhoneFormChange}
        onNext={updateProfile}
        onCancel={handleBackToProfile}
        errorMessage={errorMessage}
        setErrorCode={setErrorCode}
        localLoading={localLoading}
      />
    ),
    success: (
      <SuccessfullyUpdated
        userProfile={userProfile}
        phoneFormData={phoneFormData}
        onNext={handleBackToProfile}
        onCancel={handleBackToProfile}
      />
    ),
  };

  return localLoading ? (
    <Loader text={loaderPageContentJson["11"]} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
