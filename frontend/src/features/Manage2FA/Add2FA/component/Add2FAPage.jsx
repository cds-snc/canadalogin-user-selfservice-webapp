import { useEffect, useState } from "react";
import { useParams } from "react-router";
import Loader from "../../../../components/Layout/Loading";
import { useUser } from "../../../../components/Providers/useUser";
import { useNavigateHelper } from "../../../../hooks/useNavigate";
import { FLOW_TYPES, PAGES, serverMapping } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";
import { path } from "../../../../utils/routeHelpers";
import { otpFactors } from "../../../ChangePassword/api/otpFactors";
import OtpSelection from "../../../ChangePassword/components/OtpSelection";
import OtpVerification from "../../../ChangePassword/components/OtpVerification";
import { add2FA } from "../api/add2FA";
import Add2FANumber from "./Add2FANumber";
import Add2FAOtpVerification from "./Add2FAOtpVerification";
import AddSecond2FA from "./AddSecond2FA";

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

export default function Add2FAPage() {
  const { language } = useParams();
  const { state } = useUser();

  const [userPhoneFactors, setUserPhoneFactors] = useState([]);
  const [otpSentResponse, setOtpSentResponse] = useState(null);
  const [userOtpValue, setUserOtpValue] = useState("");
  const pageContentJson = getPageContent(language, PAGES.otpSelection);

  const [errorCode, setErrorCode] = useState("");
  const errorPageJson = getPageContent(language, PAGES.error);

  const [wizardStep, setWizardStep] = useState("add2FANumber");
  const [localLoading, setLocalLoading] = useState(false);
  const { userProfile } = state;
  const { id } = userProfile ?? {};
  const [userSelectedMfaType, setUserSelectedMfaType] = useState(null);
  const navigateHelper = useNavigateHelper();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
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

  const handlePhoneForm = (field, value) => {
    setPhoneFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangeUserMfaSelection = (mfaType) => {
    const selectedMfaType = userPhoneFactors.find(
      (factor) => factor.type === mfaType,
    );

    if (selectedMfaType.type && selectedMfaType.phoneNumber) {
      setUserSelectedMfaType(selectedMfaType);
    }
  };

  const handleOtpSentResponse = (otpResponse) => {
    setOtpSentResponse(otpResponse);
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

      const response = await add2FA.enrollMFA(payload);
      if (response && response.data && response.data.id) {
        handlePhoneForm("mfaId", response.data.id);
      }
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

      const response = await add2FA.sendMFAOTP(payload);
      if (response && response.data && response.data.id) {
        handlePhoneForm("trxnId", response.data.id);
        if (!reSendOtpCode) {
          setWizardStep("add2FAValidation");
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
      setLocalLoading(true);
      const payload = {
        id: phoneFormData.mfaId,
        otp: phoneFormData.otp,
        trxnId: phoneFormData.trxnId,
        otpType: serverMapping[phoneFormData.otpType],
      };

      const response = await add2FA.verifyMFAOTP(payload);
      if (response && response.success) {
        const visibleDigits = phoneFormData.phoneNumber.slice(-4);
        if (
          visibleDigits in userPhoneFactorsMap &&
          userPhoneFactorsMap[visibleDigits].length >= 2
        ) {
          navigateHelper(backToSecuritySettingsPage);
        } else {
          setWizardStep("addSecond2FA");
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

  useEffect(() => {
    const fetchUserOtpPhoneFactors = async () => {
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
          setUserSelectedMfaType(userPhoneFactors[0]);
          const userPhoneFactorsMap = userPhoneFactors.reduce((acc, factor) => {
            const visibleDigits = factor.phoneNumber.replace(/\D/g, "");
            acc[visibleDigits] = acc[visibleDigits]
              ? [...acc[visibleDigits], factor.type]
              : [factor.type];
            return acc;
          }, {});
          setUserPhoneFactorsMap(userPhoneFactorsMap);
        } else {
          navigateHelper(backToSecuritySettingsPage);
        }
      } catch (err) {
        console.error("Error fetching user OTP phone factors:", err);
      }
    };

    fetchUserOtpPhoneFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneFormData.trxnId]);

  const steps = {
    otpSelection: (
      <OtpSelection
        userProfile={userProfile}
        userPhoneFactors={userPhoneFactors}
        onChangeUserMfaType={handleChangeUserMfaSelection}
        userSelectedMfaType={userSelectedMfaType}
        onNext={() => {
          setWizardStep("otpValidation");
        }}
      />
    ),
    otpValidation: (
      <OtpVerification
        userProfile={userProfile}
        userSelectedMfaType={userSelectedMfaType}
        onChangeUserMfaType={handleChangeUserMfaSelection}
        userOtpValue={userOtpValue}
        setUserOtpValue={handleSetUserOtpValue}
        otpSentResponse={otpSentResponse}
        setOtpSentResponse={handleOtpSentResponse}
        onNext={() => {
          setWizardStep("add2FANumber");
        }}
        onBack={() => setWizardStep("otpSelection")}
      />
    ),
    add2FANumber: (
      <Add2FANumber
        onNext={async () => {
          const enrollMfaResponse = await enrollMFA();
          await sendMFAOtp({
            reSendOtpCode: false,
            mfaId: enrollMfaResponse?.data?.id,
          });
        }}
        onCancel={() => navigateHelper(backToSecuritySettingsPage)}
        onChangePhoneForm={handlePhoneForm}
        phoneFormData={phoneFormData}
      />
    ),
    add2FAValidation: (
      <Add2FAOtpVerification
        userProfile={userProfile}
        phoneFormData={phoneFormData}
        onChangePhoneForm={handlePhoneForm}
        errorCode={errorCode}
        onNext={() => {
          verifyMFAOtp();
        }}
        onCancel={() => {
          navigateHelper(backToSecuritySettingsPage);
        }}
        requestNewOtpCode={() => {
          sendMFAOtp({ reSendOtpCode: true });
        }}
        onBack={() => {
          setErrorCode("");
          setWizardStep("addSecond2FA");
        }}
      />
    ),
    addSecond2FA: (
      <AddSecond2FA
        phoneFormData={phoneFormData}
        onSkipForNowLink={backToSecuritySettingsPage}
        onAddSecond2FA={async () => {
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
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      errorPageJson={errorPageJson}
    />
  );
}
