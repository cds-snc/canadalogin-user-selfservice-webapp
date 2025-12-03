import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { getPageContent } from "../../../utils/functions.jsx";
import { PAGES, FLOW_TYPES } from "../../../utils/constants.jsx";
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
  const { language, step } = useParams();
  const { state, dispatch } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Map URL step parameter to internal wizard steps
  const getWizardStepFromUrl = (urlStep) => {
    switch (urlStep) {
      case "verify-otp":
        return "verifyOtp";
      case "confirm-update":
        return "confirmUpdate";
      case "success":
        return "success";
      default:
        return "enterPhone";
    }
  };

  const [wizardStep, setWizardStep] = useState(getWizardStepFromUrl(step));
  const [errorCode, setErrorCode] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [phoneFormData, setPhoneFormData] = useState({
    phoneNumber: "",
    otp: "",
    trxid: "",
    otpType: FLOW_TYPES.sms,
    formattedPhoneNumber: "",
  });

  const loaderPageContentJson = getPageContent(language, PAGES.otpSelection);
  const errorPageJson = getPageContent(language, PAGES.error);

  const { updateProfileSuccess } = userProfileDispatch(dispatch);
  const backToProfile = path(PAGES.ProfileHome, { language: language });
  const { userProfile } = state;
  const { userName } = userProfile ?? {};

  // Sync wizard step with URL parameter changes
  useEffect(() => {
    const newWizardStep = getWizardStepFromUrl(step);
    if (newWizardStep !== wizardStep) {
      setWizardStep(newWizardStep);
    }
  }, [step, wizardStep]);

  // Check if we're coming from a redirect with state data
  useEffect(() => {
    if (location?.state?.phoneFormData && location.state.step) {
      // If we have state with a specific step, navigate to that step
      setPhoneFormData(location.state.phoneFormData);
      setWizardStep(location.state.step);
    }
  }, [location.state]);

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
        userName: userName,
        otpType: serverMapping[otpType || phoneFormData.otpType],
      };

      const response = await authService.transientOtpSend(formdata);
      if (response && response.data && response.data.trxnId) {
        handlePhoneFormChange("trxnId", response.data.trxnId);
        if (!reSendOtpCode) {
          setWizardStep("verifyOtp");
          // Navigate to OTP verification URL while preserving state
          navigate(`/${language}/profile/update-contact-phone/verify-otp`, {
            replace: true,
          });
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
    try {
      setLocalLoading(true);
      setErrorCode("");

      const formdata = {
        otp: phoneFormData.otp,
        trxnId: phoneFormData.trxnId,
        otpType: serverMapping[phoneFormData.otpType],
      };

      const response = await authService.transientOtpVerify(formdata);
      if (response && response.success) {
        setWizardStep("confirmUpdate");
        // Navigate to confirmation URL while preserving state
        navigate(`/${language}/profile/update-contact-phone/confirm-update`, {
          replace: true,
        });
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
      setErrorCode("");

      const formdata = {
        userName: userName,
        phoneNumbers: [{ value: phoneFormData.phoneNumber, type: "mobile" }],
      };

      const response = await authService.update_my_user_profile(formdata);
      if (response && response.success && response.data) {
        updateProfileSuccess(response.data);
        setWizardStep("success");
        // Navigate to success URL while preserving state
        navigate(`/${language}/profile/update-contact-phone/success`, {
          replace: true,
        });
      }
    } catch (error) {
      if (error && error.data && error.data.message) {
        setErrorCode(error.data.message);
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
