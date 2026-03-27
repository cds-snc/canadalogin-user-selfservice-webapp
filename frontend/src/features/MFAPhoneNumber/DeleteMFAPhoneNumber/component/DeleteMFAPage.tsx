import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import Loader from "../../../../components/Layout/Loading";
import { useUser } from "../../../../components/Providers/useUser";
import {
  INVALID_OTP_ERROR_CODES,
  PAGES,
  serverMapping,
} from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { path } from "../../../../utils/routeHelpers";
import OtpSelection from "../../../TransientOtp/components/OtpSelection";
import OtpVerification from "../../../TransientOtp/components/OtpVerification";
import { deleteMFAPhoneNumberApi } from "../api/DeleteMFAPhoneNumberAPI";
import DeleteMFAPhoneNumberConfirm from "./DeleteMFAPhoneNumberConfirm";
import PasswordVerification from "../../../TransientOtp/components/PasswordVerification";
import StepContent from "../../../../components/Wizard/StepContent";
import { usePasswordValidation } from "../../../../hooks/usePasswordValidation";
import { useOtpOperations } from "../../../../hooks/useOtpOperations";
import { OtpFactor } from "../../../../types/hooks";
import { useFormTracking } from "../../../../hooks/useFormTracking";

interface DeletePhoneFormData {
  phoneNumber: string;
  otp: string;
  formattedPhoneNumber: string;
  mfaFactorsToDelete: OtpFactor[];
}

type WizardStep =
  | "passwordVerification"
  | "otpSelection"
  | "otpValidation"
  | "deleteMFAPhoneNumberConfirm";

export default function DeleteMFAPage() {
  const { language } = useParams();
  const location = useLocation();
  const [savedLocationState, setSavedLocationState] = useState<{
    factorIds?: string[];
  } | null>(null);
  const { factorIds } = savedLocationState || {};

  const { state } = useUser();
  const [userPasswordValue, setUserPasswordValue] = useState("");
  const pageContentJson = getPageContent(language, PAGES.otpSelection)!;

  const [errorCode, setErrorCode] = useState("");
  const errorMessage = getErrorMessage(language, errorCode);
  const [wizardStep, setWizardStep] = useState<WizardStep>(
    "passwordVerification",
  );
  const { userProfile } = state;
  const { id, userName } = userProfile ?? {};
  const navigate = useNavigate();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });
  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  // Initialize form tracking
  const {
    trackStepChange,
    trackStepAttempt,
    trackFormSubmit,
    trackStepError,
    trackSuccess,
  } = useFormTracking({
    formId: "delete_mfa_phone_number",
    page: "manage_profile_delete_mfa",
    initialStep: wizardStep,
  });

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    () => {
      trackStepChange(
        userPhoneFactors && userPhoneFactors.length === 1
          ? "otpValidation"
          : "otpSelection",
        "verify_password",
      );

      if (userPhoneFactors && userPhoneFactors.length === 1) {
        setWizardStep("otpValidation");
      } else {
        setWizardStep("otpSelection");
      }
    },
  );

  // Create tracked password validation wrapper
  const handleValidatePassword = async (password: string) => {
    trackStepAttempt("password_verification_initiated", "verify_password");
    await validatePassword(password);
  };

  // Use the OTP operations hook
  const {
    userPhoneFactors,
    userSelectedMfaFactor,
    userOtpValue,
    otpSentResponse,
    otpLoading: localLoading,
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    requestOtpCode,
  } = useOtpOperations({
    userId: id,
    userName,
    setErrorCode,
    fallbackNavigationPath: backToSecuritySettingsPage,
  });

  const [phoneFormData, setPhoneFormData] = useState<DeletePhoneFormData>({
    phoneNumber: "",
    otp: "",
    formattedPhoneNumber: "",
    mfaFactorsToDelete: [],
  });

  const handlePhoneForm = (field: string, value: unknown) => {
    setPhoneFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const deleteMFA = async () => {
    try {
      const verificationOtpType = userSelectedMfaFactor
        ? serverMapping[
            userSelectedMfaFactor.type as keyof typeof serverMapping
          ]
        : serverMapping[
            phoneFormData.mfaFactorsToDelete[0]
              ?.type as keyof typeof serverMapping
          ];

      await Promise.all(
        phoneFormData.mfaFactorsToDelete.map((mfaFactor) =>
          deleteMFAPhoneNumberApi.deleteMFA({
            id: mfaFactor.id,
            otpType:
              serverMapping[mfaFactor.type as keyof typeof serverMapping],
            otp: userOtpValue,
            trxnId: otpSentResponse?.trxnId,
            otpVerificationType: verificationOtpType,
          }),
        ),
      );

      trackSuccess("mfa_delete_success", "delete_mfa");
      setErrorCode("");
      navigate(backToManage2FAVerificationsPage, {
        state: {
          noticeType: "mfaDeleted",
          phoneNumber: phoneFormData.formattedPhoneNumber,
        },
      });
    } catch (error) {
      const err = error as { data?: { message?: string } };
      const errorMsg = err?.data?.message ?? "DELETE_MFA_FAILED";
      setErrorCode(errorMsg);
      trackStepError(`mfa_delete_failed: ${errorMsg}`, "delete_mfa");

      if ((INVALID_OTP_ERROR_CODES as readonly string[]).includes(errorMsg)) {
        setWizardStep("otpValidation");
        trackStepChange("otpValidation", "back");
      }
    }
  };

  // Custom validateOtpCode that handles delete MFA flow
  const validateOtpCode = async () => {
    trackStepAttempt("user_phone_otp_validation_initiated", "user_phone_otp");
    setWizardStep("deleteMFAPhoneNumberConfirm");
    trackStepChange("deleteMFAPhoneNumberConfirm", "user_phone_otp");
  };

  useEffect(() => {
    const locationState = location?.state as { factorIds?: string[] } | null;
    if (locationState?.factorIds && locationState.factorIds.length > 0) {
      // save location state to local state, when the language is toggled the location.state is null
      setSavedLocationState(locationState);
    } else {
      // redirect to edit page if no factor data exists
      navigate(backToManage2FAVerificationsPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Check if factorIds exist in savedLocationState and userPhoneFactors are available
    if (!savedLocationState?.factorIds || !userPhoneFactors.length) return;

    // If factor data is provided via location state, pre-select the factors
    if (factorIds && factorIds.length > 0) {
      const mfaFactorsToDelete = userPhoneFactors.filter((factor) =>
        factorIds.includes(factor.id),
      );
      if (mfaFactorsToDelete.length > 0) {
        // Use the first matching factor for display, but collect all types for deletion
        const firstFactor = mfaFactorsToDelete[0];

        // Set the data in phoneFormData for deletion
        handlePhoneForm("mfaFactorsToDelete", mfaFactorsToDelete);
        handlePhoneForm("phoneNumber", firstFactor.destination);
        handlePhoneForm("formattedPhoneNumber", `${firstFactor.destination}`);
      } else {
        // Factor not found, go back to manage page
        navigate(backToManage2FAVerificationsPage);
      }
    } else {
      // No specific factor selected, go back to manage page (shouldn't happen in normal flow)
      navigate(backToManage2FAVerificationsPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factorIds, userPhoneFactors]);

  const steps: Record<WizardStep, React.ReactElement> = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        validatePassword={handleValidatePassword}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        parentPage={PAGES.addMFAPage}
      />
    ),
    otpSelection: (
      <OtpSelection
        userPhoneFactors={userPhoneFactors}
        onChangeUserSelectedMfaFactor={handleChangeUserMfaSelection}
        onNext={() => {
          trackStepChange("otpValidation", "phone_selection");
          setWizardStep("otpValidation");
        }}
        parentPage={PAGES.deleteMFAPage}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
      />
    ),
    otpValidation: (
      <OtpVerification
        userProfile={userProfile}
        userSelectedMfaFactor={userSelectedMfaFactor!}
        userOtpValue={userOtpValue}
        setUserOtpValue={handleSetUserOtpValue}
        requestOtpCode={() => {
          trackStepAttempt(
            "user_phone_otp_request_initiated",
            "user_phone_otp",
          );
          return requestOtpCode();
        }}
        validateOtpCode={validateOtpCode}
        onBack={() => {
          const prevStep =
            userPhoneFactors && userPhoneFactors.length === 1
              ? "passwordVerification"
              : "otpSelection";
          trackStepChange(prevStep, "back");
          setWizardStep(prevStep);
        }}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        showTryAnotherWay={userPhoneFactors && userPhoneFactors.length > 1}
      />
    ),
    deleteMFAPhoneNumberConfirm: (
      <DeleteMFAPhoneNumberConfirm
        onNext={async () => {
          try {
            trackFormSubmit("mfa_delete_submit_clicked", "verify");
            trackStepAttempt("mfa_delete_initiated", "delete_mfa");
            await deleteMFA();
          } catch (error) {
            const err = error as { data?: { message?: string } };
            const errorMsg = err?.data?.message ?? "DELETE_MFA_FAILED";
            setErrorCode(errorMsg);
            if (
              (INVALID_OTP_ERROR_CODES as readonly string[]).includes(errorMsg)
            ) {
              setWizardStep("otpValidation");
              trackStepChange("otpValidation", "back");
            }
          }
        }}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        phoneFormData={phoneFormData}
      />
    ),
  };

  return localLoading || validatePasswordLoading ? (
    <Loader text={pageContentJson["11"]} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
