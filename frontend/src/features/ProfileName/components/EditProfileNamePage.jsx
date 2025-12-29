import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { getPageContent } from "../../../utils/functions.jsx";
import { PAGES } from "../../../utils/constants.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { authService } from "../../../services/authService.jsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";
import StepContent from "../../../components/Wizard/StepContent.jsx";
import Loader from "../../../components/Layout/Loading.jsx";
import ProfileUpdateName from "./ProfileUpdateName.jsx";
import ConfirmUpdate from "./ConfirmUpdate.jsx";
import SuccessfullyUpdated from "./SuccessfullyUpdated.jsx";

export default function EditProfileNamePage() {
  const { language, step } = useParams();
  const { state, dispatch } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Map URL step parameter to internal wizard steps
  const getWizardStepFromUrl = (urlStep) => {
    switch (urlStep) {
      case "confirm-update":
        return "confirmUpdate";
      case "success":
        return "success";
      default:
        return "editName";
    }
  };

  const [wizardStep, setWizardStep] = useState(getWizardStepFromUrl(step));
  const [errorCode, setErrorCode] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [nameFormData, setNameFormData] = useState({
    givenName: "",
    familyName: "",
    formatted: "",
  });

  const loaderPageContentJson = getPageContent(language, PAGES.otpSelection);
  const errorPageJson = getPageContent(language, PAGES.error);

  const { updateProfileSuccess } = userProfileDispatch(dispatch);
  const backToProfile = path(PAGES.ProfileHome, { language: language });

  // Sync wizard step with URL parameter changes
  useEffect(() => {
    const newWizardStep = getWizardStepFromUrl(step);
    if (newWizardStep !== wizardStep) {
      setWizardStep(newWizardStep);
    }
  }, [step, wizardStep]);

  // Check if we're coming from a redirect with state data
  useEffect(() => {
    if (location?.state?.name && location.state.step) {
      // If we have state with a specific step, navigate to that step
      setNameFormData(location.state.name);
      setWizardStep(location.state.step);
    }
  }, [location.state]);
  const handleNameFormChange = (field, value) => {
    setNameFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitNameForm = () => {
    const updatedName = {
      givenName: nameFormData.givenName,
      familyName: nameFormData.familyName,
      formatted: `${nameFormData.givenName} ${nameFormData.familyName}`,
    };
    setNameFormData(updatedName);
    setWizardStep("confirmUpdate");
    // Navigate to confirmation URL while preserving state
    navigate(`/${language}/profile/update-name/confirm-update`, {
      replace: true,
    });
  };

  const saveUpdatedProfileData = async () => {
    try {
      setLocalLoading(true);
      const response = await authService.update_my_user_profile({
        name: nameFormData,
        userId: state.userProfile.id,
      });
      updateProfileSuccess(response.data);
      setWizardStep("success");
      setErrorCode("");
      // Navigate to success URL while preserving state
      navigate(`/${language}/profile/update-name/success`, { replace: true });
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleBackToProfile = async () => {
    navigate(backToProfile);
  };

  let errorMessage = errorPageJson[errorCode] || "";
  if (errorCode && errorMessage === "") {
    errorMessage = errorCode;
  }

  const steps = {
    editName: (
      <ProfileUpdateName
        nameFormData={nameFormData}
        onNameFormChange={handleNameFormChange}
        onNext={handleSubmitNameForm}
        onCancel={handleBackToProfile}
        errorMessage={errorMessage}
        setErrorCode={setErrorCode}
      />
    ),
    confirmUpdate: (
      <ConfirmUpdate
        nameFormData={nameFormData}
        onConfirm={saveUpdatedProfileData}
        onCancel={handleBackToProfile}
        onBack={() => {
          setWizardStep("editName");
          navigate(`/${language}/profile/update-name`, { replace: true });
        }}
        errorMessage={errorMessage}
        setErrorCode={setErrorCode}
        localLoading={localLoading}
      />
    ),
    success: (
      <SuccessfullyUpdated
        nameFormData={nameFormData}
        onBackToProfile={handleBackToProfile}
      />
    ),
  };

  return localLoading ? (
    <Loader text={loaderPageContentJson["11"]} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
