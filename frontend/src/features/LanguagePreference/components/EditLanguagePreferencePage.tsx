import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

import { useUser } from "../../../components/Providers/useUser";
import {
  convertLanguageToLanguageCode,
  getPageContent,
} from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { authService } from "../../../services/authService";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import { useFormTracking } from "../../../hooks/useFormTracking";
import StepContent from "../../../components/Wizard/StepContent";
import Loader from "../../../components/Layout/Loading";
import ConfirmUpdate from "./ConfirmUpdate";
import EditLanguagePreferences from "./EditLanguagePreferences";
import SuccessfullyUpdated from "./SuccessfullyUpdated";
import type {
  LanguagePreferenceFormData,
  LanguagePreferencePageContent,
  LanguagePreferenceWizardStep,
} from "../../../types/languagePreference";
import type {
  AuthServiceError,
  AuthServiceResponse,
} from "../../../types/services";
import type { UserProfile } from "../../../types/user";

type LanguagePreferenceLocationState = {
  languageFormData?: LanguagePreferenceFormData;
  step?: LanguagePreferenceWizardStep;
};

function getWizardStepFromUrl(urlStep?: string): LanguagePreferenceWizardStep {
  switch (urlStep) {
    case "confirm-update":
      return "confirmUpdate";
    case "success":
      return "success";
    default:
      return "editLanguage";
  }
}

function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const authError = error as AuthServiceError;
  return authError.data?.message ?? authError.response?.data?.message;
}

export default function EditLanguagePreferencePage() {
  const { language = "en", step } = useParams<{
    language: string;
    step?: string;
  }>();
  const routeLanguage: LanguagePreferenceFormData["languageCode"] =
    language === "fr" ? "fr" : "en";
  const { state, dispatch } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState =
    location.state as LanguagePreferenceLocationState | null;

  const [wizardStep, setWizardStep] = useState<LanguagePreferenceWizardStep>(
    getWizardStepFromUrl(step),
  );
  const [errorCode, setErrorCode] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [languageFormData, setLanguageFormData] =
    useState<LanguagePreferenceFormData>({
      updatedPreferredLanguage: state.userProfile?.preferredLanguage || "",
      languageCode: routeLanguage,
    });

  const { trackStepChange, trackStepAttempt, trackStepError, trackApiCall } =
    useFormTracking({
      formId: "language_preference_update",
      page: "edit_language",
      initialStep: wizardStep,
    });

  const loaderPageContentJson =
    (getPageContent(routeLanguage, PAGES.otpSelection) as
      | LanguagePreferencePageContent
      | undefined) ?? {};
  const errorPageJson =
    (getPageContent(routeLanguage, PAGES.error) as
      | LanguagePreferencePageContent
      | undefined) ?? {};

  const { updateProfileSuccess } = userProfileDispatch(dispatch);
  const backToProfile = path(PAGES.ProfileHome, { language: routeLanguage });

  useEffect(() => {
    const newWizardStep = getWizardStepFromUrl(step);
    if (newWizardStep !== wizardStep) {
      setWizardStep(newWizardStep);
    }
  }, [step, wizardStep]);

  useEffect(() => {
    if (locationState?.languageFormData && locationState.step) {
      setLanguageFormData(locationState.languageFormData);
      setWizardStep(locationState.step);
    }
  }, [locationState]);

  const handleLanguageFormChange = (updatedPreferredLanguage: string) => {
    trackStepAttempt("language_selection_initiated", "select_language");

    const languageCode = convertLanguageToLanguageCode(
      updatedPreferredLanguage,
    ) as LanguagePreferenceFormData["languageCode"];

    setLanguageFormData({
      updatedPreferredLanguage,
      languageCode,
    });
  };

  const handleSubmitLanguageForm = () => {
    trackStepAttempt("language_form_submit_initiated", "select_language");

    setWizardStep("confirmUpdate");
    trackStepChange("confirmUpdate", "select_language");
    navigate(`/${routeLanguage}/profile/update-language/confirm-update`, {
      replace: true,
    });
  };

  const saveUpdatedLanguagePreferences = async () => {
    try {
      setLocalLoading(true);
      setErrorCode("");
      trackStepAttempt("language_update_submit_initiated", "update_language");

      const response = await trackApiCall(
        "update_my_user_profile",
        "PATCH",
        async () => {
          const result = await authService.update_my_user_profile({
            preferredLanguage: languageFormData.updatedPreferredLanguage,
            user_id: state.userProfile?.id,
          });
          return result as AuthServiceResponse<UserProfile>;
        },
        "update_language"
      );

      if (response?.data) {
        updateProfileSuccess(response.data);
        setWizardStep("success");
        trackStepChange("success", "update_language");

        const successLanguageCode = convertLanguageToLanguageCode(
          response.data.preferredLanguage || routeLanguage,
        );
        navigate(`/${successLanguageCode}/profile/update-language/success`, {
          replace: true,
        });
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (message) {
        setErrorCode(message);
        trackStepError(`language_update_failed: ${message}`, "update_language");
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleBackToProfile = () => {
    navigate(backToProfile);
  };

  let errorMessage = errorPageJson[errorCode] || "";
  if (errorCode && errorMessage === "") {
    errorMessage = errorCode;
  }

  const steps: Record<LanguagePreferenceWizardStep, ReactNode> = {
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
      language={routeLanguage}
    />
  );
}
