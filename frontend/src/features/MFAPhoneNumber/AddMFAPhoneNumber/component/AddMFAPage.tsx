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
      if (userPhoneFactors && userPhoneFactors.length === 1) {
        const success = await requestOtpCode();
        if (success) setWizardStep("otpValidation");
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
      }
      setErrorCode("");
      return response;
    } catch (error) {
      const err = error as { data?: { message?: string } };
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
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
        if (!reSendOtpCode) {
          setWizardStep("addMFAValidation");
        }
      }
    } catch (error) {
      const err = error as { data?: { message?: string } };
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
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
        }
        setErrorCode("");
      }
    } catch (error) {
      const err = error as { data?: { message?: string } };
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
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
    } catch (error) {
      const err = error as { data?: { message?: string } };
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
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
        setWizardStep("addMFANumber");
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
        await deleteMFA({
          id: existingMfa.id,
          otpType: existingMfa.type,
        });
      }
    }
    // Enroll new MFA after deletion
    const enrollMfaResponse = await enrollMFA();
    const enrollData = enrollMfaResponse as
      | {
          data?: { id?: string };
        }
      | null
      | undefined;
    if (enrollData && enrollData.data && enrollData.data.id) {
      await sendMFAOtp({
        reSendOtpCode: false,
        mfaId: enrollData.data.id,
      });
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
    const enrollData = enrollMfaResponse as
      | {
          data?: { id?: string };
        }
      | null
      | undefined;
    if (enrollData?.data?.id) {
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
        validatePassword={validatePassword}
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
            if (success) setWizardStep("otpValidation");
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
