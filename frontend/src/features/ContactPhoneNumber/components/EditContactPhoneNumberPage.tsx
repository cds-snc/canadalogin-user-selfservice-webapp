import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router";

import { useUser } from "../../../components/Providers/useUser";
import { getPageContent } from "../../../utils/functions";
import {
  FLOW_TYPES,
  INVALID_OTP_ERROR_CODES,
  PAGES,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { authService } from "../../../services/authService";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import { useFormTracking } from "../../../hooks/useFormTracking";
import StepContent from "../../../components/Wizard/StepContent";
import Loader from "../../../components/Layout/Loading";
import EnterPhoneNumber from "./EnterPhoneNumber";
import OtpVerification from "./OtpVerification";
import ConfirmUpdate from "./ConfirmUpdate";
import SuccessfullyUpdated from "./SuccessfullyUpdated";
import type {
  ContactPhoneFormData,
  ContactPhoneOtpType,
  ContactPhonePageContent,
  ContactPhoneTransactionData,
  ContactPhoneWizardStep,
} from "../../../types/contactPhoneNumber";
import type {
  AuthServiceError,
  AuthServiceResponse,
} from "../../../types/services";
import type { UserProfile } from "../../../types/user";

type UpdatePhoneTransport = "sms" | "voice";

const serverMapping: Record<ContactPhoneOtpType, UpdatePhoneTransport> = {
  [FLOW_TYPES.sms]: "sms",
  [FLOW_TYPES.voice]: "voice",
};

const initialPhoneFormData: ContactPhoneFormData = {
  phoneNumber: "",
  otp: "",
  trxnId: "",
  otpType: FLOW_TYPES.sms,
  formattedPhoneNumber: "",
};

function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const authError = error as AuthServiceError;
  return authError.data?.message ?? authError.response?.data?.message;
}

export default function EditContactPhoneNumberPage() {
  const { language = "en" } = useParams<{ language: string }>();
  const { state, dispatch } = useUser();
  const navigate = useNavigate();

  const [wizardStep, setWizardStep] =
    useState<ContactPhoneWizardStep>("enterPhone");
  const [errorCode, setErrorCode] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [phoneFormData, setPhoneFormData] =
    useState<ContactPhoneFormData>(initialPhoneFormData);

  // Initialize form tracking
  const { trackStepChange, trackStepAttempt, trackStepError, trackApiCall } =
    useFormTracking({
      formId: "contact_phone_number_update",
      page: "edit_phone",
      initialStep: wizardStep,
    });

  const loaderPageContentJson =
    (getPageContent(language, PAGES.otpSelection) as
      | ContactPhonePageContent
      | undefined) ?? {};
  const errorPageJson =
    (getPageContent(language, PAGES.error) as
      | ContactPhonePageContent
      | undefined) ?? {};

  const { updateProfileSuccess } = userProfileDispatch(dispatch);
  const backToProfile = path(PAGES.ProfileHome, { language });
  const { userProfile } = state;
  const { id } = userProfile ?? {};

  const handlePhoneFormChange = <TField extends keyof ContactPhoneFormData>(
    field: TField,
    value: ContactPhoneFormData[TField],
  ) => {
    setPhoneFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const sendOtp = async ({
    reSendOtpCode = false,
    otpType,
  }: {
    reSendOtpCode?: boolean;
    otpType?: ContactPhoneOtpType;
  } = {}) => {
    try {
      if (!reSendOtpCode) {
        setLocalLoading(true);
        trackStepAttempt("phone_number_entry_initiated", "enter_phone");
      } else {
        trackStepAttempt("phone_otp_resend_initiated", "phone_otp");
      }

      setErrorCode("");

      const response = await trackApiCall(
        "transient_otp_send",
        "POST",
        async () => {
          const result = await authService.transientOtpSend({
            destination: phoneFormData.phoneNumber,
            user_id: id,
            otpType: serverMapping[otpType ?? phoneFormData.otpType],
          });
          return result as AuthServiceResponse<ContactPhoneTransactionData>;
        },
        "phone_otp",
      );

      if (response?.data?.trxnId) {
        handlePhoneFormChange("trxnId", response.data.trxnId);
        if (!reSendOtpCode) {
          setWizardStep("verifyOtp");
          trackStepChange("verifyOtp", "enter_phone");
        }
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (message) {
        setErrorCode(message);
        trackStepError(
          `${reSendOtpCode ? "phone_otp_resend_failed" : "phone_otp_request_failed"}: ${message}`,
          "phone_otp",
        );
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const verifyOtp = async () => {
    trackStepAttempt("phone_otp_validation_initiated", "phone_otp");
    setWizardStep("confirmUpdate");
    trackStepChange("confirmUpdate", "phone_otp");
  };

  const updateProfile = async () => {
    try {
      setLocalLoading(true);
      setErrorCode("");
      trackStepAttempt("phone_update_submit_initiated", "update_phone");

      const response = await trackApiCall(
        "update_phone_with_otp",
        "PATCH",
        async () => {
          const result = await authService.update_phone_with_otp(
            phoneFormData.phoneNumber,
            phoneFormData.otp,
            phoneFormData.trxnId,
            serverMapping[phoneFormData.otpType],
          );
          return result as AuthServiceResponse<UserProfile>;
        },
        "update_phone",
      );

      if (response?.success && response.data) {
        updateProfileSuccess(response.data);
        setWizardStep("success");
        trackStepChange("success", "update_phone");
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (message) {
        setErrorCode(message);
        trackStepError(`phone_update_failed: ${message}`, "update_phone");

        if (
          INVALID_OTP_ERROR_CODES.includes(
            message as (typeof INVALID_OTP_ERROR_CODES)[number],
          )
        ) {
          console.log("OTP validation failed during phone update:", message);
          setWizardStep("verifyOtp");
          trackStepChange("verifyOtp", "back");
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
    trackStepChange("enterPhone", "back");
    setWizardStep("enterPhone");
    navigate(`/${language}/profile/update-contact-phone`, { replace: true });
  };

  let errorMessage = errorPageJson[errorCode] || "";
  if (errorCode && errorMessage === "") {
    errorMessage = errorCode;
  }

  const steps: Record<ContactPhoneWizardStep, ReactNode> = {
    enterPhone: (
      <EnterPhoneNumber
        userProfile={userProfile}
        phoneFormData={phoneFormData}
        onChangePhoneForm={handlePhoneFormChange}
        errorMessage={errorMessage}
        onNext={sendOtp}
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
          sendOtp({ reSendOtpCode: true, otpType })
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
