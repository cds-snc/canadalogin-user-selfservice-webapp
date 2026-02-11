import { useRef, useState } from "react";
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

export default function AddMFAPage() {
  const { language } = useParams();
  const { state } = useUser();

  const [userPasswordValue, setUserPasswordValue] = useState<string>("");
  const pageContentJson = getPageContent(language, PAGES.otpSelection);

  const [errorCode, setErrorCode] = useState("");

  const [wizardStep, setWizardStep] = useState("passwordVerification");
  const { userProfile } = state;
  const [phoneFormData, setPhoneFormData] = useState({
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
    () => {
      // If there's only one MFA factor, skip OTP selection and go directly to validation
      if (userPhoneFactors && userPhoneFactors.length === 1) {
        setWizardStep("otpValidation");
      } else {
        setWizardStep("otpSelection");
      }
    },
  );

  // Use the OTP operations hook
  const {
    userPhoneFactors,
    userSelectedMfaFactor,
    userOtpValue,
    otpSentResponse,
    localLoading,
    phoneFactorsMap: userPhoneFactorsMap,
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    setLocalLoading,
    setOtpSentResponse,
  } = useOtpOperations(
    id,
    userName,
    setErrorCode,
    backToSecuritySettingsPage,
    MAP_TYPES.lastFourDigits,
    phoneFormData?.trxnId,
  );

  const successBannerJson = getPageContent(language, PAGES.successBanner);
  const errorMessage = getErrorMessage(language, errorCode);

  const handlePhoneForm = (field, value) => {
    setPhoneFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const enrollMFA = async ({ phoneNumber, otpType } = {}) => {
    setLocalLoading(true);
    setErrorCode("");
    try {
      const payload = {
        phoneNumber: phoneNumber ?? phoneFormData.phoneNumber,
        otpType: serverMapping[otpType ?? phoneFormData.otpType],
      };

      const response = await addMFAPhoneNumberApi.enrollMFA(payload);
      if (response && response.data && response.data.id) {
        handlePhoneForm("mfaId", response.data.id);
      }
      setErrorCode("");
      return response;
    } catch (error) {
      if (error && error.data && error.data.message) {
        setErrorCode(error.data.message);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const sendMFAOtp = async ({ reSendOtpCode = false, mfaId, otpType } = {}) => {
    if (!reSendOtpCode) {
      setLocalLoading(true);
    }
    setErrorCode("");

    try {
      const payload = {
        id: mfaId ?? phoneFormData.mfaId,
        otpType: serverMapping[otpType ?? phoneFormData.otpType],
      };

      const response = await addMFAPhoneNumberApi.sendMFAOTP(payload);
      if (response && response.data && response.data.id) {
        handlePhoneForm("trxnId", response.data.id);
        if (!reSendOtpCode) {
          setWizardStep("addMFAValidation");
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

  const verifyMFAOtp = async () => {
    try {
      const payload = {
        id: phoneFormData.mfaId,
        otp: phoneFormData.otp,
        trxnId: phoneFormData.trxnId,
        otpType: serverMapping[phoneFormData.otpType],
      };

      const response = await addMFAPhoneNumberApi.verifyMFAOTP(payload);
      if (response && response.success) {
        const visibleDigits = phoneFormData.phoneNumber.slice(-4);
        if (
          visibleDigits in userPhoneFactorsMap &&
          userPhoneFactorsMap[visibleDigits].length >= 1
        ) {
          const otpType =
            phoneFormData.otpType === FLOW_TYPES.voice
              ? successBannerJson["5"]
              : successBannerJson["6"];
          navigate(backToManage2FAVerificationsPage, {
            state: {
              noticeType: "mfaAdded",
              phoneNumber: phoneFormData.formattedPhoneNumber,
              otpType: otpType,
            },
          });
        } else {
          setWizardStep("addSecondMFA");
        }
        setErrorCode("");
      }
    } catch (error) {
      if (error && error.data && error.data.message) {
        setErrorCode(error.data.message);
      }
    }
  };

  const deleteMFA = async ({ id, otpType } = {}) => {
    setLocalLoading(true);
    try {
      const payload = {
        id: id ?? phoneFormData.mfaId,
        otpType: otpType
          ? serverMapping[otpType]
          : serverMapping[phoneFormData.otpType],
      };

      await deleteMFAPhoneNumberApi.deleteMFA(payload);
    } catch (error) {
      if (error && error.data && error.data.message) {
        setErrorCode(error.data.message);
        setErrorCode("");
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const didFetch = useRef(false);

  const requestOtpCode = async () => {
    const userData = {
      user_id: userProfile.id,
      otpType: serverMapping[userSelectedMfaFactor.type],
      phoneNumber: userSelectedMfaFactor.phoneNumber,
    };
    try {
      const response = await authService.transientOtpSend(userData);
      if (response && response.success) {
        setOtpSentResponse(response.data);
        setErrorCode("");
      }
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
    } finally {
      didFetch.current = false;
    }
  };

  const validateOtpCode = async (userOtpValue) => {
    const userData = {
      otp: userOtpValue,
      trxnId: otpSentResponse.trxnId,
      otpType: serverMapping[userSelectedMfaFactor.type],
    };
    try {
      const response = await authService.transientOtpVerify(userData);
      if (response && response.success) {
        setWizardStep("addMFANumber");
        setErrorCode("");
      }
    } catch (err) {
      if (
        err &&
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        setErrorCode(err.response.data.message);
      }
    }
  };

  const handleMFAEnrollment = async () => {
    try {
      // Get unvalidated OTP phone factors
      const response = await otpFactors.getUserOtpPhoneFactors(id, false);

      // If existing unvalidated OTP found, delete it first
      if (response && response.success && response.data.length > 0) {
        const existingMfa = response.data.find(
          (factor) =>
            factor.phoneNumber.slice(-4) ===
              phoneFormData.phoneNumber.slice(-4) &&
            factor.type === phoneFormData.otpType,
        );
        if (existingMfa) {
          await deleteMFA({
            id: existingMfa.id,
            otpType: existingMfa.type,
          });
        }

        // Enroll new MFA after deletion
        const enrollMfaResponse = await enrollMFA();
        if (
          enrollMfaResponse &&
          enrollMfaResponse.data &&
          enrollMfaResponse.data.id
        ) {
          await sendMFAOtp({
            reSendOtpCode: false,
            mfaId: enrollMfaResponse?.data?.id,
          });
        }
      }
    } catch {
      // If no existing MFA found, proceed to enroll new MFA
      const enrollMfaResponse = await enrollMFA();
      if (
        enrollMfaResponse &&
        enrollMfaResponse.data &&
        enrollMfaResponse.data.id
      ) {
        await sendMFAOtp({
          reSendOtpCode: false,
          mfaId: enrollMfaResponse?.data?.id,
        });
      }
    }
  };

  async function handleSetupAlternateMFAMethod() {
    const secondMFAOtpType =
      phoneFormData.otpType === FLOW_TYPES.voice
        ? FLOW_TYPES.sms
        : FLOW_TYPES.voice;
    handlePhoneForm("otpType", secondMFAOtpType);
    const enrollMfaResponse = await enrollMFA({
      phoneNumber: phoneFormData.phoneNumber,
      otpType: secondMFAOtpType,
    });
    if (enrollMfaResponse?.data?.id) {
      await sendMFAOtp({
        reSendOtpCode: false,
        mfaId: enrollMfaResponse.data.id,
        otpType: secondMFAOtpType,
      });
    }
  }

  const steps = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        validatePassword={validatePassword}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        parentPage={PAGES.addMFAPage}
      />
    ),
    otpSelection: (
      <OtpSelection
        userProfile={userProfile}
        userPhoneFactors={userPhoneFactors}
        onChangeUserSelectedMfaFactor={handleChangeUserMfaSelection}
        userSelectedMfaFactor={userSelectedMfaFactor}
        onNext={() => {
          setWizardStep("otpValidation");
        }}
        parentPage={PAGES.addMFAPage}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
      />
    ),
    otpValidation: (
      <OtpVerification
        userProfile={userProfile}
        userSelectedMfaFactor={userSelectedMfaFactor}
        userOtpValue={userOtpValue}
        setUserOtpValue={handleSetUserOtpValue}
        requestOtpCode={requestOtpCode}
        validateOtpCode={validateOtpCode}
        onBack={() => {
          // If there's only one MFA factor, go back to password verification
          // Otherwise, go back to OTP selection
          if (userPhoneFactors && userPhoneFactors.length === 1) {
            setWizardStep("passwordVerification");
          } else {
            setWizardStep("otpSelection");
          }
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
        userProfile={userProfile}
        phoneFormData={phoneFormData}
        onChangePhoneForm={handlePhoneForm}
        errorMessage={errorMessage}
        onNext={async () => {
          await verifyMFAOtp();
        }}
        onCancel={async () => {
          navigate(backToManage2FAVerificationsPage);
        }}
        requestNewOtpCode={async () => {
          await sendMFAOtp({ reSendOtpCode: true });
        }}
        onBack={async () => {
          setErrorCode("");
          await deleteMFA();
          setWizardStep("addMFANumber");
        }}
        onUseDifferentPhoneNumber={async () => {
          await deleteMFA();
        }}
        onSetupAlternateMFAMethod={async () => {
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
              ? successBannerJson["5"]
              : successBannerJson["6"];
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
