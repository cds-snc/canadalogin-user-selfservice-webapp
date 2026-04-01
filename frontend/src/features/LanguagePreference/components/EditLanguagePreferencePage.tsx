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
import { useFormTracking } from "../../../hooks/useFormTracking";
import { GA_FORM_EVENTS } from "../../../utils/analyticsConstants";
import { LANGUAGE_PREFERENCE_ANALYTICS } from "../../../utils/analyticsConstants";
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

  const { trackEvent } = useFormTracking({
    formId: LANGUAGE_PREFERENCE_ANALYTICS.FLOW_ID,
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
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: LANGUAGE_PREFERENCE_ANALYTICS.STEPS.SELECT_LANGUAGE,
    });

    const languageCode = convertLanguageToLanguageCode(
      updatedPreferredLanguage,
    ) as LanguagePreferenceFormData["languageCode"];

    setLanguageFormData({
      updatedPreferredLanguage,
      languageCode,
    });
  };

  const handleSubmitLanguageForm = () => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_SUBMIT,
      step: LANGUAGE_PREFERENCE_ANALYTICS.STEPS.SELECT_LANGUAGE,
    });

    setWizardStep("confirmUpdate");
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
      step: LANGUAGE_PREFERENCE_ANALYTICS.STEPS.CONFIRM_UPDATE,
    });
    navigate(`/${routeLanguage}/profile/update-language/confirm-update`, {
      replace: true,
    });
  };

  const saveUpdatedLanguagePreferences = async () => {
    try {
      setLocalLoading(true);
      setErrorCode("");

      const result = await authService.update_my_user_profile({
        preferredLanguage: languageFormData.updatedPreferredLanguage,
        user_id: state.userProfile?.id,
      });
      const response = result as AuthServiceResponse<UserProfile>;

      if (response?.data) {
        updateProfileSuccess(response.data);
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: LANGUAGE_PREFERENCE_ANALYTICS.STEPS.SUCCESS,
        });

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
      } else {
        setErrorCode("LANGUAGE_UPDATE_FAILED");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: LANGUAGE_PREFERENCE_ANALYTICS.STEPS.SELECT_LANGUAGE,
          error: "LANGUAGE_UPDATE_FAILED",
        });
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (message) {
        setErrorCode(message);
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: LANGUAGE_PREFERENCE_ANALYTICS.STEPS.SELECT_LANGUAGE,
          error: message,
        });
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
        onConfirm={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT,
            step: LANGUAGE_PREFERENCE_ANALYTICS.STEPS.CONFIRM_UPDATE,
          });
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: LANGUAGE_PREFERENCE_ANALYTICS.STEPS.CONFIRM_UPDATE,
          });
          return saveUpdatedLanguagePreferences();
        }}
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
