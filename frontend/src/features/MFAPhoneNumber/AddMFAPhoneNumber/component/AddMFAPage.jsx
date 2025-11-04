import { GcdsErrorMessage } from "@cdssnc/gcds-components-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import Loader from "../../../../components/Layout/Loading";
import { useUser } from "../../../../components/Providers/useUser";
import { useNavigateHelper } from "../../../../hooks/useNavigate";
import { FLOW_TYPES, PAGES, serverMapping } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";
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

const StepContent = ({ StepComponent }) => {
  return <>{StepComponent}</>;
};

export default function AddMFAPage() {
  const { language } = useParams();
  const { state } = useUser();

  const [userPhoneFactors, setUserPhoneFactors] = useState([]);
  const [otpSentResponse, setOtpSentResponse] = useState(null);
  const [userOtpValue, setUserOtpValue] = useState("");
  const [userPasswordValue, setUserPasswordValue] = useState("");
  const pageContentJson = getPageContent(language, PAGES.otpSelection);

  const [errorCode, setErrorCode] = useState("");

  const [wizardStep, setWizardStep] = useState("passwordVerification");
  const [localLoading, setLocalLoading] = useState(true);
  const { userProfile } = state;
  const { id, userName } = userProfile ?? {};
  const [userSelectedMfaFactor, setUserSelectedMfaFactor] = useState(null);
  const navigateHelper = useNavigateHelper();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });
  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  const [userPhoneFactorsMap, setUserPhoneFactorsMap] = useState({});
  const [phoneFormData, setPhoneFormData] = useState({
    phoneNumber: "",
    otp: "",
    mfaId: "",
    trxnId: "",
    otpType: FLOW_TYPES.sms,
    formattedPhoneNumber: "",
  });

  const successBannerJson = getPageContent(language, PAGES.successBanner);

  const handlePhoneForm = (field, value) => {
    setPhoneFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangeUserMfaSelection = (id) => {
    const selectedMfaFactor = userPhoneFactors.find(
      (factor) => factor.id === id,
    );

    if (selectedMfaFactor) {
      setUserSelectedMfaFactor(selectedMfaFactor);
    }
  };

  const handleSetUserOtpValue = (userOtpValue) => {
    setUserOtpValue(userOtpValue);
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
      setErrorCode("");
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
          await navigateHelper(backToManage2FAVerificationsPage, false, {
            noticeType: "mfaAdded",
            phoneNumber: phoneFormData.formattedPhoneNumber,
            otpType: otpType,
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
      userName,
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

  const validatePassword = async (userPasswordValue) => {
    try {
      const passwordPolicyResponse = await authService.requestPasswordPolicy();
      if (passwordPolicyResponse.success) {
        const passwordPolicy = {
          min: passwordPolicyResponse.data.pwdMinLength,
          max: passwordPolicyResponse.data.pwdMaxLength,
        };
        if (
          !userPasswordValue ||
          userPasswordValue.length < passwordPolicy.min ||
          userPasswordValue.length > passwordPolicy.max
        ) {
          setErrorCode("5");
          return;
        }
      }
      const response = await authService.verifyPassword({
        password: userPasswordValue,
      });
      if (response && response.success) {
        setWizardStep("otpSelection");
        setErrorCode("");
      }
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
    }
  };

  useEffect(() => {
    const fetchUserOtpPhoneFactors = async () => {
      setLocalLoading(true);
      try {
        const response = await otpFactors.getUserOtpPhoneFactors(id);
        if (
          response &&
          response.success &&
          response.data.length > 0 &&
          response.data[0].type
        ) {
          const userPhoneFactors = response.data;
          setUserPhoneFactors(userPhoneFactors);
          setUserSelectedMfaFactor(userPhoneFactors[0]);
          const userPhoneFactorsMap = userPhoneFactors.reduce((acc, factor) => {
            const visibleDigits = factor.phoneNumber.slice(-4);
            acc[visibleDigits] = acc[visibleDigits]
              ? [...acc[visibleDigits], factor.type]
              : [factor.type];
            return acc;
          }, {});
          setUserPhoneFactorsMap(userPhoneFactorsMap);
        } else {
          await navigateHelper(backToSecuritySettingsPage);
        }
      } catch (err) {
        console.error("Error fetching user OTP phone factors:", err);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchUserOtpPhoneFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneFormData.trxnId]);

  const steps = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={async () =>
          await navigateHelper(backToManage2FAVerificationsPage)
        }
        validatePassword={validatePassword}
        errorCode={errorCode}
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
        onCancel={async () =>
          await navigateHelper(backToManage2FAVerificationsPage)
        }
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
        onBack={() => setWizardStep("otpSelection")}
        errorCode={errorCode}
      />
    ),
    addMFANumber: (
      <AddMFAPhoneNumber
        onNext={async () => {
          try {
            const response = await otpFactors.getUserOtpPhoneFactors(id, false);
            if (response && response.success && response.data.length > 0) {
              await deleteMFA({
                id: response.data[0].id,
                otpType: response.data[0].type,
              });
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
        }}
        onCancel={async () =>
          await navigateHelper(backToManage2FAVerificationsPage)
        }
        onChangePhoneForm={handlePhoneForm}
        phoneFormData={phoneFormData}
        errorCode={errorCode}
      />
    ),
    addMFAValidation: (
      <AddMFAOtpVerification
        userProfile={userProfile}
        phoneFormData={phoneFormData}
        onChangePhoneForm={handlePhoneForm}
        errorCode={errorCode}
        onNext={async () => {
          await verifyMFAOtp();
        }}
        onCancel={async () => {
          await navigateHelper(backToManage2FAVerificationsPage);
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
          await navigateHelper(backToManage2FAVerificationsPage, false, {
            noticeType: "mfaAdded",
            phoneNumber: phoneFormData.formattedPhoneNumber,
            otpType: otpType,
          });
        }}
        onAddSecondMFA={async () => {
          const secondMFAOtpType =
            phoneFormData.otpType === FLOW_TYPES.voice
              ? FLOW_TYPES.sms
              : FLOW_TYPES.voice;
          handlePhoneForm("otpType", secondMFAOtpType);
          const enrollMfaResponse = await enrollMFA({
            phoneNumber: phoneFormData.phoneNumber,
            otpType: secondMFAOtpType,
          });
          await sendMFAOtp({
            reSendOtpCode: false,
            mfaId: enrollMfaResponse?.data?.id,
            otpType: secondMFAOtpType,
          });
        }}
      />
    ),
  };

  return localLoading ? (
    <Loader text={pageContentJson["11"]} />
  ) : (
    <StepContent StepComponent={steps[wizardStep]} />
  );
}
