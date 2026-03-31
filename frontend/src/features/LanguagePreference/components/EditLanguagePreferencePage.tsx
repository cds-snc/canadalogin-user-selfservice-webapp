import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation, useParams } from "react-router";

import { useUser } from "../../../components/Providers/useUser";
import {
  convertLanguageToLanguageCode,
  getPageContent,
} from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { authService } from "../../../services/authService";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
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

function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const authError = error as AuthServiceError;
  return authError.data?.message ?? authError.response?.data?.message;
}

export default function EditLanguagePreferencePage() {
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage: LanguagePreferenceFormData["languageCode"] =
    language === "fr" ? "fr" : "en";
  const { state, dispatch } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const initialStep =
    (location.state as { step?: LanguagePreferenceWizardStep } | null)?.step ??
    "editLanguage";

  const [wizardStep, setWizardStep] =
    useState<LanguagePreferenceWizardStep>(initialStep);
  const [errorCode, setErrorCode] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [languageFormData, setLanguageFormData] =
    useState<LanguagePreferenceFormData>({
      updatedPreferredLanguage: state.userProfile?.preferredLanguage || "",
      languageCode: routeLanguage,
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

  const handleLanguageFormChange = (updatedPreferredLanguage: string) => {
    const languageCode = convertLanguageToLanguageCode(
      updatedPreferredLanguage,
    ) as LanguagePreferenceFormData["languageCode"];

    setLanguageFormData({
      updatedPreferredLanguage,
      languageCode,
    });
  };

  const handleSubmitLanguageForm = () => {
    setWizardStep("confirmUpdate");
  };

  const saveUpdatedLanguagePreferences = async () => {
    try {
      setLocalLoading(true);
      setErrorCode("");

      const response = (await authService.update_my_user_profile({
        preferredLanguage: languageFormData.updatedPreferredLanguage,
        user_id: state.userProfile?.id,
      })) as AuthServiceResponse<UserProfile> | undefined;

      if (response?.data) {
        updateProfileSuccess(response.data);

        const successLanguageCode = convertLanguageToLanguageCode(
          response.data.preferredLanguage || routeLanguage,
        ) as LanguagePreferenceFormData["languageCode"];

        if (successLanguageCode !== routeLanguage) {
          // Language changed — navigate to the new language URL immediately so
          // the whole app switches locale. The success step is shown on arrival
          // via location state read by the useState initializer above.
          navigate(`/${successLanguageCode}/profile/update-language`, {
            replace: true,
            state: { step: "success" as LanguagePreferenceWizardStep },
          });
        } else {
          setWizardStep("success");
        }
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (message) {
        setErrorCode(message);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleBackToProfile = () => {
    navigate(
      path(PAGES.ProfileHome, { language: languageFormData.languageCode }),
    );
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
