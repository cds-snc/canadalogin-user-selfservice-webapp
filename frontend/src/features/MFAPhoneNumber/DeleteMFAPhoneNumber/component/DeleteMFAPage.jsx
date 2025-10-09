import { GcdsErrorMessage } from "@cdssnc/gcds-components-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import Loader from "../../../../components/Layout/Loading";
import { useUser } from "../../../../components/Providers/useUser";
import { useNavigateHelper } from "../../../../hooks/useNavigate";
import { PAGES, serverMapping } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";
import { path } from "../../../../utils/routeHelpers";
import { otpFactors } from "../../../ChangePassword/api/otpFactors";
import OtpSelection from "../../../ChangePassword/components/OtpSelection";
import OtpVerification from "../../../ChangePassword/components/OtpVerification";
import { deleteMFAPhoneNumberApi } from "../api/DeleteMFAPhoneNumberAPI";
import DeleteMFAPhoneNumberConfirm from "./DeleteMFAPhoneNumberConfirm";

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

export default function DeleteMFAPage() {
  const { language, mfaId } = useParams();
  const { state } = useUser();
  const [userPhoneFactors, setUserPhoneFactors] = useState([]);

  const [otpSentResponse, setOtpSentResponse] = useState(null);
  const [userOtpValue, setUserOtpValue] = useState("");
  const pageContentJson = getPageContent(language, PAGES.otpSelection);

  const [errorCode, setErrorCode] = useState("");
  const errorPageJson = getPageContent(language, PAGES.error);

  const [wizardStep, setWizardStep] = useState("deleteMFAPhoneNumberConfirm");
  const [localLoading, setLocalLoading] = useState(false);
  const { userProfile } = state;
  const { id } = userProfile ?? {};
  const [userSelectedMfaType, setUserSelectedMfaType] = useState(null);
  const navigateHelper = useNavigateHelper();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });
  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  const [phoneFormData, setPhoneFormData] = useState({
    phoneNumber: "",
    otp: "",
    mfaId: "",
    otpTypes: [],
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

  const deleteMFA = async () => {
    setLocalLoading(true);
    setErrorCode("");

    try {
      for (const otpType of phoneFormData.otpTypes) {
        const payload = {
          id: phoneFormData.mfaId,
          otpType: serverMapping[otpType],
        };

        await deleteMFAPhoneNumberApi.deleteMFA(payload);
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

          // If phoneNumber and factorId are provided via URL params, pre-select the factor
          if (mfaId) {
            const selectedFactors = userPhoneFactors.filter(
              (factor) => factor.id === mfaId,
            );
            if (selectedFactors.length > 0) {
              // Use the first matching factor for display, but collect all types for deletion
              const firstFactor = selectedFactors[0];
              const allTypes = selectedFactors.map((factor) => factor.type);

              // Set the mfaId in phoneFormData for deletion
              handlePhoneForm("mfaId", mfaId);
              handlePhoneForm("phoneNumber", firstFactor.phoneNumber);
              handlePhoneForm("otpTypes", allTypes);
              handlePhoneForm(
                "formattedPhoneNumber",
                `+1 ${firstFactor.phoneNumber}`,
              );
            } else {
              // Factor not found, go back to manage page
              navigateHelper(backToManage2FAVerificationsPage);
            }
          } else {
            // No specific factor selected, use the first one
            setUserSelectedMfaType(userPhoneFactors[0]);
          }
        } else {
          navigateHelper(backToSecuritySettingsPage);
        }
      } catch (err) {
        console.error("Error fetching user OTP phone factors:", err);
      }
    };

    fetchUserOtpPhoneFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneFormData.trxnId, mfaId]);

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
          setWizardStep("deleteMFAPhoneNumberConfirm");
        }}
        onBack={() => setWizardStep("otpSelection")}
      />
    ),
    deleteMFAPhoneNumberConfirm: (
      <DeleteMFAPhoneNumberConfirm
        onNext={async () => {
          await deleteMFA();
          navigateHelper(backToManage2FAVerificationsPage);
        }}
        onCancel={() => navigateHelper(backToManage2FAVerificationsPage)}
        phoneFormData={phoneFormData}
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
