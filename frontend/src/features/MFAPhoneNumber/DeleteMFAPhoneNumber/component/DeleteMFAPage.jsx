import { GcdsErrorMessage } from "@cdssnc/gcds-components-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import Loader from "../../../../components/Layout/Loading";
import { useUser } from "../../../../components/Providers/useUser";
import { useNavigateHelper } from "../../../../hooks/useNavigate";
import { PAGES, serverMapping } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";
import { path } from "../../../../utils/routeHelpers";
import { otpFactors } from "../../../TransientOtp/api/otpFactors";
import OtpSelection from "../../../TransientOtp/components/OtpSelection";
import OtpVerification from "../../../TransientOtp/components/OtpVerification";
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
  const { language } = useParams();
  const location = useLocation();
  const { factorIds } = location.state || {};
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

  const [phoneFormData, setPhoneFormData] = useState({
    phoneNumber: "",
    otp: "",
    formattedPhoneNumber: "",
    mfaFactorsToDelete: [],
  });

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

  const deleteMFA = async () => {
    setErrorCode("");

    try {
      await Promise.all(
        phoneFormData.mfaFactorsToDelete.map((mfaFactor) =>
          deleteMFAPhoneNumberApi.deleteMFA({
            id: mfaFactor.id,
            otpType: serverMapping[mfaFactor.type],
          }),
        ),
      );
    } catch (error) {
      if (error && error.data && error.data.message) {
        setErrorCode(error.data.message);
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
          // If factor data is provided via location state, pre-select the factors
          if (factorIds && factorIds.length > 0) {
            const mfaFactorsToDelete = userPhoneFactors.filter((factor) =>
              factorIds.includes(factor.id),
            );
            if (mfaFactorsToDelete.length > 0) {
              // Use the first matching factor for display, but collect all types for deletion
              const firstFactor = mfaFactorsToDelete[0];

              // Set the data in phoneFormData for deletion
              handlePhoneForm("mfaFactorsToDelete", mfaFactorsToDelete); // Use first ID for backward compatibility
              handlePhoneForm("phoneNumber", firstFactor.phoneNumber);
              handlePhoneForm(
                "formattedPhoneNumber",
                `${firstFactor.phoneNumber}`,
              );
            } else {
              // Factor not found, go back to manage page
              await navigateHelper(backToManage2FAVerificationsPage);
            }
          } else {
            // No specific factor selected, go back to manage page (shouldn't happen in normal flow)
            await navigateHelper(backToManage2FAVerificationsPage);
          }
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
  }, [factorIds]);

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
          setWizardStep("deleteMFAPhoneNumberConfirm");
        }}
        onBack={() => setWizardStep("otpSelection")}
      />
    ),
    deleteMFAPhoneNumberConfirm: (
      <DeleteMFAPhoneNumberConfirm
        onNext={async () => {
          try {
            await deleteMFA();
            await navigateHelper(backToManage2FAVerificationsPage);
          } catch (error) {
            setErrorCode(error?.message || "Unexpected API request error");
          }
        }}
        onCancel={async () =>
          await navigateHelper(backToManage2FAVerificationsPage)
        }
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
