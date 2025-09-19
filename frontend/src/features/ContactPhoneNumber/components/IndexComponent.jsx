import { useState } from "react";
import { useParams } from "react-router";
import { GcdsErrorMessage } from "@cdssnc/gcds-components-react";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";
import {
  NAVIGATION_LINKS,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants.jsx";
import { getPageContent } from "../../../utils/functions.jsx";
import { authService } from "../../../services/authService.jsx";

import { useUser } from "../../../components/Providers/useUser.tsx";
import Loader from "../../../components/Layout/Loading.jsx";
import EnterPhoneNumber from "./EnterPhoneNumber.jsx";
import OtpVerification from "./OtpVerification.jsx";
import ConfirmUpdate from "./ConfirmUpdate.jsx";
import SuccessfullyUpdated from "./SuccessfullyUpdated.jsx";
import { transientOtp } from "../api/transientOtp.js";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";

const STEPS = {
  ENTER: "enterPhoneNumber",
  VERIFY: "otpVerification",
  CONFIRM: "confirm",
  SUCCESS: "success",
};

// Map frontend FLOW_TYPES to backend otpType
// Backend: sms | voice
// Frontnd: smsotp | voiceotp
// IBM Verify seems to use both smsotp | voiceotp and sms | voice
const serverMapping = {
  [FLOW_TYPES.sms]: "sms",
  [FLOW_TYPES.voice]: "voice",
};

const StepContent = ({ errorCode, errorPageJson, StepComponent }) => {
  let errorMessage = errorPageJson[errorCode] || "";

  if (errorMessage === "" && errorCode === "Unexpected API request error") {
    errorMessage = errorPageJson["7"];
  }

  return (
    <>
      {errorMessage && (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      )}
      {StepComponent}
    </>
  );
};

export default function UpdateContactPhoneNumber() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const [errorCode, setErrorCode] = useState("");
  const errorPageJson = getPageContent(language, PAGES.error);

  const { userProfile } = state;
  const { userName } = userProfile ?? {};

  const [localLoading, setLocalLoading] = useState(false);

  const [step, setStep] = useState(STEPS.ENTER);
  const loadingMessage = getPageContent(language, PAGES.otpSelection);
  const { updateProfileSuccess } = userProfileDispatch(dispatch);

  const [phoneFormData, setPhoneFormData] = useState({
    phoneNumber: "",
    otp: "",
    trxid: "",
    otpType: FLOW_TYPES.sms,
    formattedPhoneNumber: "",
  });

  const navigateHelper = useNavigateHelper();
  const backtoProfile = `/${language}${NAVIGATION_LINKS.profile}`;

  const handleLoading = (bool) => {
    setLocalLoading(bool);
  };

  const handlePhoneForm = (field, value) => {
    setPhoneFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const sendOTP = async ({ reSendOtpCode = false } = {}) => {
    if (!reSendOtpCode) setLocalLoading(true);
    setErrorCode("");

    try {
      const formdata = {
        phoneNumber: phoneFormData.phoneNumber,
        userName: userName,
        otpType: serverMapping[phoneFormData.otpType],
      };

      const response = await transientOtp.sendOtp(formdata);
      if (response && response.data && response.data.trxnId) {
        handlePhoneForm("trxnId", response.data.trxnId);
        if (!reSendOtpCode) setStep(STEPS.VERIFY);
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
        otp: phoneFormData.otp,
        trxnId: phoneFormData.trxnId,
        otpType: serverMapping[phoneFormData.otpType],
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
        userName: userName,
        phoneNumbers: [{ value: phoneFormData.phoneNumber, type: "mobile" }],
      };

      const response = await authService.update_my_user_profile(formdata);
      if (response && response.success && response.data) {
        setErrorCode("");
        setStep(STEPS.SUCCESS);
        updateProfileSuccess(response.data);
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
        errorCode={errorCode}
        onNext={() => {
          sendOTP();
        }}
        onCancel={() => {
          navigateHelper(backtoProfile);
        }}
      />
    ),
    otpVerification: (
      <OtpVerification
        userProfile={userProfile}
        phoneFormData={phoneFormData}
        onChangePhoneForm={handlePhoneForm}
        errorCode={errorCode}
        onNext={() => {
          verifyOtp();
        }}
        onCancel={() => {
          navigateHelper(backtoProfile);
        }}
        onBack={() => {
          setErrorCode("");
          setStep(STEPS.ENTER);
        }}
        requestNewOtpCode={() => {
          sendOTP({ reSendOtpCode: true });
        }}
      />
    ),
    confirm: (
      <ConfirmUpdate
        userProfile={userProfile}
        phoneFormData={phoneFormData}
        onChangePhoneForm={handlePhoneForm}
        errorCode={errorCode}
        onNext={() => {
          updateProfile();
        }}
        onCancel={() => {
          navigateHelper(backtoProfile);
        }}
      />
    ),
    success: (
      <SuccessfullyUpdated
        userProfile={userProfile}
        phoneFormData={phoneFormData}
        onNext={() => {
          navigateHelper(backtoProfile);
        }}
        onCancel={() => {
          navigateHelper(backtoProfile);
        }}
      />
    ),
  };

  return localLoading ? (
    <Loader text={loadingMessage["11"]} />
  ) : (
    <StepContent
      StepComponent={steps[step]}
      errorCode={errorCode}
      errorPageJson={errorPageJson}
    />
  );
}
