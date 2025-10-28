import { GcdsErrorMessage } from "@cdssnc/gcds-components-react";
import { useEffect, useRef, useState } from "react";
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
import { authService } from "../../../../services/authService";
import PasswordVerification from "../../../TransientOtp/components/PasswordVerification";

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
  const [userPasswordValue, setUserPasswordValue] = useState("");
  const [userOtpValue, setUserOtpValue] = useState("");
  const pageContentJson = getPageContent(language, PAGES.otpSelection);

  const [errorCode, setErrorCode] = useState("");
  const errorPageJson = getPageContent(language, PAGES.error);

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

  const handleSetUserOtpValue = (userOtpValue) => {
    setUserOtpValue(userOtpValue);
  };

  const deleteMFA = async () => {
    try {
      await Promise.all(
        phoneFormData.mfaFactorsToDelete.map((mfaFactor) =>
          deleteMFAPhoneNumberApi.deleteMFA({
            id: mfaFactor.id,
            otpType: serverMapping[mfaFactor.type],
          }),
        ),
      );
      setErrorCode("");
    } catch (error) {
      if (error && error.data && error.data.message) {
        setErrorCode(error.data.message);
      }
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
      }
      setErrorCode("");
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
        setWizardStep("deleteMFAPhoneNumberConfirm");
      }
      setErrorCode("");
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
    }
  };

  const validatePassword = async (userPasswordValue) => {
    if (
      !userPasswordValue ||
      userPasswordValue.length < 12 ||
      userPasswordValue.length > 65
    ) {
      setErrorCode("5");
      return;
    }
    try {
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
        parentPage={PAGES.deleteMFAPage}
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
    deleteMFAPhoneNumberConfirm: (
      <DeleteMFAPhoneNumberConfirm
        onNext={async () => {
          try {
            await deleteMFA();
            await navigateHelper(backToManage2FAVerificationsPage, false, {
              noticeType: "mfaDeleted",
              phoneNumber: phoneFormData.formattedPhoneNumber,
            });
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
