import { GcdsErrorMessage } from "@cdssnc/gcds-components-react";
import { useEffect, useState } from "react";
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

export default function AddMFAPage() {
  const { language } = useParams();
  const { state } = useUser();

  const [userPhoneFactors, setUserPhoneFactors] = useState([]);
  const [otpSentResponse, setOtpSentResponse] = useState(null);
  const [userOtpValue, setUserOtpValue] = useState("");
  const pageContentJson = getPageContent(language, PAGES.otpSelection);

  const [errorCode, setErrorCode] = useState("");
  const errorPageJson = getPageContent(language, PAGES.error);

  const [wizardStep, setWizardStep] = useState("otpSelection");
  const [localLoading, setLocalLoading] = useState(false);
  const { userProfile } = state;
  const { id } = userProfile ?? {};
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

      const response = await addMFAPhoneNumberApi.enrollMFA(payload);
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
          userPhoneFactorsMap[visibleDigits].length >= 2
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
      }
    } catch (error) {
      if (error && error.data && error.data.message) {
        setErrorCode(error.data.message);
      }
    }
  };

  const deleteMFA = async () => {
    setLocalLoading(true);
    setErrorCode("");

    try {
      const payload = {
        id: phoneFormData.mfaId,
        otpType: serverMapping[phoneFormData.otpType],
      };

      await deleteMFAPhoneNumberApi.deleteMFA(payload);
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
            const visibleDigits = factor.phoneNumber.replace(/\D/g, "");
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
      />
    ),
    otpValidation: (
      <OtpVerification
        userProfile={userProfile}
        userSelectedMfaFactor={userSelectedMfaFactor}
        userOtpValue={userOtpValue}
        setUserOtpValue={handleSetUserOtpValue}
        otpSentResponse={otpSentResponse}
        setOtpSentResponse={handleOtpSentResponse}
        onNext={() => {
          setWizardStep("addMFANumber");
        }}
        onBack={() => setWizardStep("otpSelection")}
      />
    ),
    addMFANumber: (
      <AddMFAPhoneNumber
        onNext={async () => {
          const enrollMfaResponse = await enrollMFA();
          await sendMFAOtp({
            reSendOtpCode: false,
            mfaId: enrollMfaResponse?.data?.id,
          });
        }}
        onCancel={async () =>
          await navigateHelper(backToManage2FAVerificationsPage)
        }
        onChangePhoneForm={handlePhoneForm}
        phoneFormData={phoneFormData}
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
        onBack={() => {
          setErrorCode("");
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
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      errorPageJson={errorPageJson}
    />
  );
}
