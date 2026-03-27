import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import Loader from "../../../../components/Layout/Loading";
import { useUser } from "../../../../components/Providers/useUser";
import { FLOW_TYPES, PAGES, serverMapping } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { path } from "../../../../utils/routeHelpers";
import { otpFactors } from "../../../TransientOtp/api/otpFactors";
import OtpSelection from "../../../TransientOtp/components/OtpSelection";
import OtpVerification from "../../../TransientOtp/components/OtpVerification";
import { deleteMFAPhoneNumberApi } from "../../DeleteMFAPhoneNumber/api/DeleteMFAPhoneNumberAPI";
import { addMFAPhoneNumberApi } from "../api/AddMFAPhoneNumberAPI";
import AddMFAOtpVerification from "./AddMFAOtpVerification";
import AddMFAPhoneNumber from "./AddMFAPhoneNumber";
import AddSecondMFA from "./AddSecondMFA";
import { authService } from "../../../../services/authService";
import PasswordVerification from "../../../TransientOtp/components/PasswordVerification";
import StepContent from "../../../../components/Wizard/StepContent";
import { usePasswordValidation } from "../../../../hooks/usePasswordValidation";
import {
  MAP_TYPES,
  useOtpOperations,
} from "../../../../hooks/useOtpOperations";
import { useFormTracking } from "../../../../hooks/useFormTracking";

interface PhoneFormData {
  phoneNumber: string;
  otp: string;
  mfaId: string;
  trxnId: string;
  otpType: string;
  formattedPhoneNumber: string;
}

type WizardStep =
  | "passwordVerification"
  | "otpSelection"
  | "otpValidation"
  | "addMFANumber"
  | "addMFAValidation"
  | "addSecondMFA";

export default function AddMFAPage() {
  const { language } = useParams();
  const { state } = useUser();

  const [userPasswordValue, setUserPasswordValue] = useState("");
  const pageContentJson = getPageContent(language, PAGES.otpSelection)!;

  const [errorCode, setErrorCode] = useState("");

  const [wizardStep, setWizardStep] = useState<WizardStep>(
    "passwordVerification",
  );

  const {
    trackStepChange,
    trackStepAttempt,
    trackFormSubmit,
    trackStepError,
    trackSuccess,
  } = useFormTracking({
    formId: "add_mfa_phone_number",
    page: "manage_app_add_mfa",
    initialStep: wizardStep,
  });

  const { userProfile } = state;
  const [phoneFormData, setPhoneFormData] = useState<PhoneFormData>({
    phoneNumber: "",
    otp: "",
    mfaId: "",
    trxnId: "",
    otpType: FLOW_TYPES.sms,
    formattedPhoneNumber: "",
  });

  const { id, userName } = userProfile ?? {};

  const navigate = useNavigate();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });
  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    async () => {
      // If there's only one MFA factor, skip OTP selection and go directly to validation
      trackStepChange(
        userPhoneFactors && userPhoneFactors.length === 1
          ? "otpValidation"
          : "otpSelection",
        "verify_password",
      );
      if (userPhoneFactors && userPhoneFactors.length === 1) {
        const success = await requestOtpCode();
        if (success) setWizardStep("otpValidation");
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
    phoneFactorsMap: userPhoneFactorsMap,
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    setOtpLoading: setLocalLoading,
    requestOtpCode,
  } = useOtpOperations({
    userId: id,
    userName,
    setErrorCode,
    fallbackNavigationPath: backToSecuritySettingsPage,
    mapType: MAP_TYPES.lastFourDigits,
    mfaTrxnId: phoneFormData?.trxnId,
  });

  const noticeFactoryContent = getPageContent(language, PAGES.noticeFactory)!;
  const errorMessage = getErrorMessage(language, errorCode);

  const handlePhoneForm = (field: string, value: unknown) => {
    setPhoneFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const enrollMFA = async ({
    phoneNumber,
    otpType,
  }: { phoneNumber?: string; otpType?: string } = {}) => {
    setLocalLoading(true);
    setErrorCode("");

    try {
      const payload = {
        destination: phoneNumber ?? phoneFormData.phoneNumber,
        otpType:
          serverMapping[
            (otpType ?? phoneFormData.otpType) as keyof typeof serverMapping
          ],
      };

      const response = await addMFAPhoneNumberApi.enrollMFA(payload);

      const responseData = response as {
        data?: { id?: string };
        [key: string]: unknown;
      } | null;
      if (responseData && responseData.data && responseData.data.id) {
        handlePhoneForm("mfaId", responseData.data.id);
        trackSuccess("mfa_enroll_success", "enroll_mfa");
      }
      setErrorCode("");
      return response;
    } catch (error) {
      const err = error as { data?: { message?: string } };
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
        trackStepError(`mfa_enroll_failed: ${err.data.message}`, "enroll_mfa");
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const sendMFAOtp = async ({
    reSendOtpCode = false,
    mfaId,
    otpType,
  }: { reSendOtpCode?: boolean; mfaId?: string; otpType?: string } = {}) => {
    if (!reSendOtpCode) {
      setLocalLoading(true);
    }
    setErrorCode("");

    try {
      const payload = {
        id: mfaId ?? phoneFormData.mfaId,
        otpType:
          serverMapping[
            (otpType ?? phoneFormData.otpType) as keyof typeof serverMapping
          ],
      };

      const response = await addMFAPhoneNumberApi.sendMFAOTP(payload);

      const responseData = response as {
        data?: { id?: string };
        [key: string]: unknown;
      } | null;
      if (responseData && responseData.data && responseData.data.id) {
        handlePhoneForm("trxnId", responseData.data.id);
        trackSuccess(
          reSendOtpCode ? "mfa_otp_resend_success" : "mfa_otp_request_success",
          "mfa_otp",
        );
        if (!reSendOtpCode) {
          setWizardStep("addMFAValidation");
          trackStepChange("addMFAValidation", "enroll_mfa");
        }
      }
    } catch (error) {
      const err = error as { data?: { message?: string } };
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
        trackStepError(
          `${reSendOtpCode ? "mfa_otp_resend_failed" : "mfa_otp_request_failed"}: ${err.data.message}`,
          "mfa_otp",
        );
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const verifyMFAOtp = async () => {
    try {
      const payload = {
        id: phoneFormData.mfaId,
        otp: phoneFormData.otp,
        trxnId: phoneFormData.trxnId,
        otpType:
          serverMapping[phoneFormData.otpType as keyof typeof serverMapping],
      };

      const response = await addMFAPhoneNumberApi.verifyMFAOTP(payload);

      const responseData = response as {
        success?: boolean;
        [key: string]: unknown;
      } | null;
      if (responseData && responseData.success) {
        trackSuccess("mfa_otp_validation_success", "mfa_otp");
        const visibleDigits = phoneFormData.phoneNumber.slice(-4);
        if (
          visibleDigits in userPhoneFactorsMap &&
          (userPhoneFactorsMap[visibleDigits] as unknown[]).length >= 1
        ) {
          const otpType =
            phoneFormData.otpType === FLOW_TYPES.voice
              ? noticeFactoryContent["5"]
              : noticeFactoryContent["6"];
          navigate(backToManage2FAVerificationsPage, {
            state: {
              noticeType: "mfaAdded",
              phoneNumber: phoneFormData.formattedPhoneNumber,
              otpType: otpType,
            },
          });
        } else {
          setWizardStep("addSecondMFA");
          trackStepChange("addSecondMFA", "mfa_otp");
        }
        setErrorCode("");
      }
    } catch (error) {
      const err = error as { data?: { message?: string } };
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
        trackStepError(
          `mfa_otp_validation_failed: ${err.data.message}`,
          "mfa_otp",
        );
      }
    }
  };

  const deleteMFA = async ({
    id,
    otpType,
  }: { id?: string; otpType?: string } = {}) => {
    setLocalLoading(true);

    try {
      const payload = {
        id: id ?? phoneFormData.mfaId,
        otpType: otpType
          ? serverMapping[otpType as keyof typeof serverMapping]
          : serverMapping[phoneFormData.otpType as keyof typeof serverMapping],
      };

      await deleteMFAPhoneNumberApi.deleteMFA(payload);

      trackSuccess("mfa_delete_success", "delete_mfa");
    } catch (error) {
      const err = error as { data?: { message?: string } };
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
        trackStepError(`mfa_delete_failed: ${err.data.message}`, "delete_mfa");
        setErrorCode("");
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const validateOtpCode = async (userOtpValue: string) => {
    const userData = {
      otp: userOtpValue,
      trxnId: otpSentResponse?.trxnId ?? "",
      otpType:
        serverMapping[
          userSelectedMfaFactor!.type as keyof typeof serverMapping
        ],
    };
    try {
      const response = await authService.transientOtpVerify(userData);

      if (response && response.success) {
        trackSuccess("user_phone_otp_validation_success", "user_phone_otp");
        setWizardStep("addMFANumber");
        trackStepChange("addMFANumber", "user_phone_otp");
        setErrorCode("");
      }
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
      };
      if (
        error &&
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setErrorCode(error.response.data.message);
        trackStepError(
          `user_phone_otp_validation_failed: ${error.response.data.message}`,
          "user_phone_otp",
        );
      }
    }
  };

  const handleMFAEnrollment = async () => {
    // Get unvalidated OTP phone factors
    const response = await otpFactors.getUserOtpPhoneFactors(false);

    // If existing unvalidated OTP found, delete it first
    if (response && response.success && response.data.length > 0) {
      const existingMfa = response.data.find(
        (factor) =>
          factor.destination.slice(-4) ===
            phoneFormData.phoneNumber.slice(-4) &&
          factor.type === phoneFormData.otpType,
      );

      if (existingMfa) {
        trackStepAttempt("mfa_delete_initiated", "delete_mfa");
        await deleteMFA({
          id: existingMfa.id,
          otpType: existingMfa.type,
        });
      }
    }
    // Enroll new MFA after deletion
    trackStepAttempt("mfa_enroll_initiated", "enroll_mfa");
    const enrollMfaResponse = await enrollMFA();
    const enrollData = enrollMfaResponse as
      | {
          data?: { id?: string };
        }
      | null
      | undefined;
    if (enrollData && enrollData.data && enrollData.data.id) {
      trackFormSubmit("mfa_otp_request_submit_clicked", "verify");
      trackStepAttempt("mfa_otp_request_initiated", "mfa_otp");
      await sendMFAOtp({
        reSendOtpCode: false,
        mfaId: enrollData.data.id,
      });
    }
  };

  async function handleSetupAlternateMFAMethod() {
    trackStepAttempt("setup_alternate_mfa_initiated", "setup_alternate_mfa");

    const secondMFAOtpType =
      phoneFormData.otpType === FLOW_TYPES.voice
        ? FLOW_TYPES.sms
        : FLOW_TYPES.voice;
    handlePhoneForm("otpType", secondMFAOtpType);
    trackStepAttempt("mfa_enroll_initiated", "enroll_mfa");
    const enrollMfaResponse = await enrollMFA({
      phoneNumber: phoneFormData.phoneNumber,
      otpType: secondMFAOtpType,
    });
    const enrollData = enrollMfaResponse as
      | {
          data?: { id?: string };
        }
      | null
      | undefined;
    if (enrollData?.data?.id) {
      trackFormSubmit("mfa_otp_request_submit_clicked", "verify");
      trackStepAttempt("mfa_otp_request_initiated", "mfa_otp");
      await sendMFAOtp({
        reSendOtpCode: false,
        mfaId: enrollData.data.id,
        otpType: secondMFAOtpType,
      });
    }
  }

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
          void (async () => {
            const success = await requestOtpCode();
            if (success) {
              setWizardStep("otpValidation");
              trackStepChange("otpValidation", "phone_selection");
            }
          })();
        }}
        parentPage={PAGES.addMFAPage}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
      />
    ),
    otpValidation: (
      <OtpVerification
        userSelectedMfaFactor={userSelectedMfaFactor!}
        userOtpValue={userOtpValue}
        setUserOtpValue={handleSetUserOtpValue}
        requestOtpCode={() => {
          trackFormSubmit("user_phone_otp_request_submit_clicked", "verify");
          trackStepAttempt(
            "user_phone_otp_request_initiated",
            "user_phone_otp",
          );
          return requestOtpCode();
        }}
        validateOtpCode={(userOtp) => {
          trackFormSubmit("user_phone_otp_validation_submit_clicked", "verify");
          trackStepAttempt(
            "user_phone_otp_validation_initiated",
            "user_phone_otp",
          );
          return validateOtpCode(userOtp);
        }}
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
    addMFANumber: (
      <AddMFAPhoneNumber
        onNext={handleMFAEnrollment}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        onChangePhoneForm={handlePhoneForm}
        phoneFormData={phoneFormData}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
      />
    ),
    addMFAValidation: (
      <AddMFAOtpVerification
        phoneFormData={phoneFormData}
        onChangePhoneForm={handlePhoneForm}
        errorMessage={errorMessage}
        onNext={async () => {
          trackFormSubmit("mfa_otp_validation_submit_clicked", "verify");
          trackStepAttempt("mfa_otp_validation_initiated", "mfa_otp");
          await verifyMFAOtp();
        }}
        onCancel={async () => {
          navigate(backToManage2FAVerificationsPage);
        }}
        requestNewOtpCode={async () => {
          trackStepAttempt("mfa_otp_resend_initiated", "mfa_otp");
          await sendMFAOtp({ reSendOtpCode: true });
        }}
        onBack={async () => {
          setErrorCode("");
          trackStepChange("addMFANumber", "back");
          trackStepAttempt("mfa_delete_initiated", "delete_mfa");
          await deleteMFA();
          setWizardStep("addMFANumber");
        }}
        onUseDifferentPhoneNumber={async () => {
          trackStepAttempt("mfa_delete_initiated", "delete_mfa");
          await deleteMFA();
        }}
        onSetupAlternateMFAMethod={async () => {
          trackStepAttempt("mfa_delete_initiated", "delete_mfa");
          await deleteMFA();
          await handleSetupAlternateMFAMethod();
        }}
      />
    ),
    addSecondMFA: (
      <AddSecondMFA
        phoneFormData={phoneFormData}
        onSkipForNow={async () => {
          const otpType =
            phoneFormData.otpType === FLOW_TYPES.voice
              ? noticeFactoryContent["5"]
              : noticeFactoryContent["6"];
          navigate(backToManage2FAVerificationsPage, {
            state: {
              noticeType: "mfaAdded",
              phoneNumber: phoneFormData.formattedPhoneNumber,
              otpType: otpType,
            },
          });
        }}
        onAddSecondMFA={async () => {
          await handleSetupAlternateMFAMethod();
        }}
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
