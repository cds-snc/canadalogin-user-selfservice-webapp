import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import Loader from "../../../../components/Layout/Loading";
import { useUser } from "../../../../components/Providers/useUser";
import { useNavigateHelper } from "../../../../hooks/useNavigate";
import { FLOW_TYPES, PAGES } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";
import { path } from "../../../../utils/routeHelpers";
import { userProfileDispatch } from "../../../../utils/userProfileDispatch";
import { otpFactors } from "../../../ChangePassword/api/otpFactors";
import OtpSelection from "../../../ChangePassword/components/OtpSelection";
import OtpVerification from "../../../ChangePassword/components/OtpVerification";
import Add2FANumber from "./Add2FANumber";

export default function Add2FAPage() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { removeAuthenticatedPage } = userProfileDispatch(dispatch);
  const { pathname } = useLocation();

  const [userPhoneFactors, setUserPhoneFactors] = useState([]);

  const [otpSentResponse, setOtpSentResponse] = useState(null);
  const [userOtpValue, setUserOtpValue] = useState("");
  const pageContentJson = getPageContent(language, PAGES.otpSelection);

  const [wizardStep, setWizardStep] = useState("add2FANumber");
  const [localLoading, setLocalLoading] = useState(false);
  const { userProfile } = state;
  const { id } = userProfile ?? {};
  const [userSelectedMfaType, setUserSelectedMfaType] = useState(null);
  const navigateHelper = useNavigateHelper();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });

  const [phoneFormData, setPhoneFormData] = useState({
    phoneNumber: "",
    otp: "",
    trxid: "",
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

  const handleLoading = (bool) => {
    setLocalLoading(bool);
  };

  const handleOtpSentResponse = (otpResponse) => {
    setOtpSentResponse(otpResponse);
  };

  const handleSetUserOtpValue = (userOtpValue) => {
    setUserOtpValue(userOtpValue);
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
          setUserPhoneFactors(response.data);
          setUserSelectedMfaType(response.data[0]);
        } else {
          navigateHelper(backToSecuritySettingsPage);
        }
      } catch (err) {
        console.error("Error fetching user OTP phone factors:", err);
      }
    };

    fetchUserOtpPhoneFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      // when a user navigates away from this component, we remove the pathname from the array
      // In the Private Route handler, we track the page to avoid a redirect loop to reautenticate the user
      removeAuthenticatedPage(pathname);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = {
    otpSelection: (
      <OtpSelection
        userProfile={userProfile}
        userPhoneFactors={userPhoneFactors}
        onChangeUserMfaType={handleChangeUserMfaSelection}
        userSelectedMfaType={userSelectedMfaType}
        localLoading={localLoading}
        setLocalLoading={handleLoading}
        onNext={() => {
          setWizardStep("otpValidation");
        }}
      />
    ),
    otpValidation: (
      <OtpVerification
        userProfile={userProfile}
        userSelectedMfaType={userSelectedMfaType}
        localLoading={localLoading}
        setLocalLoading={handleLoading}
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
        onNext={() => setWizardStep("otpSelection")}
        onCancel={() => navigateHelper(backToSecuritySettingsPage)}
        onChangePhoneForm={handlePhoneForm}
        phoneFormData={phoneFormData}
      />
    ),
  };

  return (
    <>
      {userSelectedMfaType ? (
        steps[wizardStep]
      ) : (
        <Loader text={pageContentJson["12"]} />
      )}
    </>
  );
}
