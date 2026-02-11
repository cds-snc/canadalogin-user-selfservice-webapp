import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useUser } from "../../../components/Providers/useUser.tsx";
import {
  getPageContent,
  convertLanguageToLanguageCode,
} from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { authService } from "../../../services/authService";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import StepContent from "../../../components/Wizard/StepContent";
import Loader from "../../../components/Layout/Loading";
import EditLanguagePreferences from "./EditLanguagePreferences";
import ConfirmUpdate from "./ConfirmUpdate";
import SuccessfullyUpdated from "./SuccessfullyUpdated";

export default function EditLanguagePreferencePage() {
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
        return "editLanguage";
    }
  };

  const [wizardStep, setWizardStep] = useState(getWizardStepFromUrl(step));
  const [errorCode, setErrorCode] = useState<string>("");
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [languageFormData, setLanguageFormData] = useState({
    updatedPreferredLanguage: state.userProfile?.preferredLanguage || "",
    languageCode: language,
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
    if (location?.state?.languageFormData && location.state.step) {
      // If we have state with a specific step, navigate to that step
      setLanguageFormData(location.state.languageFormData);
      setWizardStep(location.state.step);
    }
  }, [location.state]);

  const handleLanguageFormChange = (updatedPreferredLanguage) => {
    const languageCode = convertLanguageToLanguageCode(
      updatedPreferredLanguage,
    );
    const data = {
      updatedPreferredLanguage: updatedPreferredLanguage,
      languageCode: languageCode,
    };
    setLanguageFormData(data);
  };

  const handleSubmitLanguageForm = () => {
    setWizardStep("confirmUpdate");
    // Navigate to confirmation URL while preserving state
    navigate(`/${language}/profile/update-language/confirm-update`, {
      replace: true,
    });
  };

  const saveUpdatedLanguagePreferences = async () => {
    try {
      setLocalLoading(true);
      const response = await authService.update_my_user_profile({
        preferredLanguage: languageFormData.updatedPreferredLanguage,
        user_id: state.userProfile.id,
      });
      updateProfileSuccess(response.data);
      setWizardStep("success");
      setErrorCode("");
      // Navigate to success URL while preserving state
      const successLanguageCode = convertLanguageToLanguageCode(
        response.data.preferredLanguage,
      );
      navigate(`/${successLanguageCode}/profile/update-language/success`, {
        replace: true,
      });
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
    editLanguage: (
      <EditLanguagePreferences
        languageFormData={languageFormData}
        onLanguageFormChange={handleLanguageFormChange}
        onNext={handleSubmitLanguageForm}
        onCancel={handleBackToProfile}
        errorMessage={errorMessage}
        setErrorCode={setErrorCode}
      />
    ),
    confirmUpdate: (
      <ConfirmUpdate
        languageFormData={languageFormData}
        onConfirm={saveUpdatedLanguagePreferences}
        onCancel={handleBackToProfile}
        errorMessage={errorMessage}
        setErrorCode={setErrorCode}
        localLoading={localLoading}
      />
    ),
    success: (
      <SuccessfullyUpdated
        languageFormData={languageFormData}
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
