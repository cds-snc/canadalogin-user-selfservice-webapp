import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router";

import { useUser } from "../../../components/Providers/useUser";
import { useTranslation } from "react-i18next";
import {
  FLOW_TYPES,
  INVALID_OTP_ERROR_CODES,
  PAGES,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { authService } from "../../../services/authService";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import { useFormTracking } from "../../../hooks/useFormTracking";
import { useWizardPageTracking } from "../../../hooks/useWizardPageTracking";
import { GA_FORM_EVENTS } from "../../../utils/analyticsConstants";
import { CONTACT_PHONE_ANALYTICS } from "../../../utils/analyticsConstants";
import StepContent from "../../../components/Wizard/StepContent";
import Loader from "../../../components/Layout/Loading";
import EnterPhoneNumber from "./EnterPhoneNumber";
import OtpVerification from "./OtpVerification";
import ConfirmUpdate from "./ConfirmUpdate";
import SuccessfullyUpdated from "./SuccessfullyUpdated";
import type {
  ContactPhoneFormData,
  ContactPhoneOtpType,
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
  expiry: "",
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

const CONTACT_PHONE_PAGE_BY_STEP: Record<ContactPhoneWizardStep, string> = {
  enterPhone: "EditContactPhoneNumberPage",
  verifyOtp: "PhoneChangeVerifyOtp",
  confirmUpdate: "PhoneChangeConfirmUpdate",
  success: "PhoneChangeSuccess",
};

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
  const { trackEvent } = useFormTracking({
    formId: CONTACT_PHONE_ANALYTICS.FLOW_ID,
  });

  useWizardPageTracking(wizardStep, CONTACT_PHONE_PAGE_BY_STEP);

  const { t } = useTranslation(["security", "common"]);

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
      }

      setErrorCode("");

      const result = await authService.transientOtpSend({
        destination: phoneFormData.phoneNumber,
        user_id: id,
        otpType: serverMapping[otpType ?? phoneFormData.otpType],
      });
      const response =
        result as AuthServiceResponse<ContactPhoneTransactionData>;

      if (response?.data?.trxnId) {
        handlePhoneFormChange("trxnId", response.data.trxnId);
        handlePhoneFormChange("expiry", response.data.expiry ?? "");
        handlePhoneFormChange("created", response.data.created ?? "");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: CONTACT_PHONE_ANALYTICS.STEPS.VERIFY_OTP,
          type: otpType ?? phoneFormData.otpType,
        });
        if (!reSendOtpCode) {
          setWizardStep("verifyOtp");
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: CONTACT_PHONE_ANALYTICS.STEPS.VERIFY_OTP,
            type: otpType ?? phoneFormData.otpType,
          });
        }
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (message) {
        setErrorCode(message);
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: CONTACT_PHONE_ANALYTICS.STEPS.ENTER_PHONE,
          type: otpType ?? phoneFormData.otpType,
          error: message,
        });
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const verifyOtp = async () => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: CONTACT_PHONE_ANALYTICS.STEPS.VERIFY_OTP,
    });
    setWizardStep("confirmUpdate");
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
      step: CONTACT_PHONE_ANALYTICS.STEPS.CONFIRM_UPDATE,
    });
  };

  const updateProfile = async () => {
    try {
      setLocalLoading(true);
      setErrorCode("");

      const result = await authService.update_phone_with_otp(
        phoneFormData.phoneNumber,
        phoneFormData.otp,
        phoneFormData.trxnId,
        serverMapping[phoneFormData.otpType],
      );
      const response = result as AuthServiceResponse<UserProfile>;

      if (response?.success && response.data) {
        updateProfileSuccess(response.data);
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: CONTACT_PHONE_ANALYTICS.STEPS.SUCCESS,
        });
        setWizardStep("success");
      } else {
        setErrorCode("PHONE_UPDATE_FAILED");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: CONTACT_PHONE_ANALYTICS.STEPS.CONFIRM_UPDATE,
          error: "PHONE_UPDATE_FAILED",
        });
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (message) {
        setErrorCode(message);
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: CONTACT_PHONE_ANALYTICS.STEPS.CONFIRM_UPDATE,
          error: message,
        });

        if (
          INVALID_OTP_ERROR_CODES.includes(
            message as (typeof INVALID_OTP_ERROR_CODES)[number],
          )
        ) {
          console.log("OTP validation failed during phone update:", message);
          setWizardStep("verifyOtp");
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: CONTACT_PHONE_ANALYTICS.STEPS.VERIFY_OTP,
            error: message,
          });
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
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
      step: CONTACT_PHONE_ANALYTICS.STEPS.ENTER_PHONE,
    });
    setWizardStep("enterPhone");
    navigate(`/${language}/profile/update-contact-phone`, { replace: true });
  };

  let errorMessage = errorCode
    ? t(`Error.${errorCode}`, { ns: "common", defaultValue: "" })
    : "";
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
        onNext={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT,
            step: CONTACT_PHONE_ANALYTICS.STEPS.ENTER_PHONE,
          });
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: CONTACT_PHONE_ANALYTICS.STEPS.ENTER_PHONE,
          });
          return sendOtp({ reSendOtpCode: false });
        }}
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
        onBack={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: CONTACT_PHONE_ANALYTICS.STEPS.ENTER_PHONE,
          });
          handleBackToEnterPhone();
        }}
        requestNewOtpCode={(otpType) => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: CONTACT_PHONE_ANALYTICS.STEPS.VERIFY_OTP,
            type: otpType,
          });
          return sendOtp({ reSendOtpCode: true, otpType });
        }}
        setErrorCode={setErrorCode}
      />
    ),
    confirmUpdate: (
      <ConfirmUpdate
        userProfile={userProfile}
        phoneFormData={phoneFormData}
        onChangePhoneForm={handlePhoneFormChange}
        onNext={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT,
            step: CONTACT_PHONE_ANALYTICS.STEPS.CONFIRM_UPDATE,
          });
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: CONTACT_PHONE_ANALYTICS.STEPS.CONFIRM_UPDATE,
          });
          return updateProfile();
        }}
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
    <Loader text={t("OtpSelection.loading")} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      errorMessage={errorMessage}
      language={language}
    />
  );
}
