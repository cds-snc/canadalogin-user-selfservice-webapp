import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router";

import { useUser } from "../../../components/Providers/useUser";
import { useTranslation } from "react-i18next";
import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { authService } from "../../../services/authService";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import { useFormTracking } from "../../../hooks/useFormTracking";
import { useWizardPageTracking } from "../../../hooks/useWizardPageTracking";
import { GA_FORM_EVENTS } from "../../../utils/analyticsConstants";
import { PROFILE_NAME_ANALYTICS } from "../../../utils/analyticsConstants";
import StepContent from "../../../components/Wizard/StepContent";
import Loader from "../../../components/Layout/Loading";
import ConfirmUpdate from "./ConfirmUpdate";
import ProfileUpdateName from "./ProfileUpdateName";
import SuccessfullyUpdated from "./SuccessfullyUpdated";
import type {
  ProfileNameFormData,
  ProfileNameWizardStep,
} from "../../../types/profileName";
import type {
  AuthServiceError,
  AuthServiceResponse,
} from "../../../types/services";
import type { UserProfile } from "../../../types/user";

function normalizeNameFormData(
  name?: UserProfile["name"] | null,
): ProfileNameFormData {
  const givenName = name?.givenName ?? "";
  const familyName = name?.familyName ?? "";
  const formatted = name?.formatted ?? `${givenName} ${familyName}`.trim();

  return {
    givenName,
    familyName,
    formatted,
  };
}

function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const authError = error as AuthServiceError;
  return authError.data?.message ?? authError.response?.data?.message;
}

const PROFILE_NAME_PAGE_BY_STEP: Record<ProfileNameWizardStep, string> = {
  editName: PAGES.editProfileNamePage,
  confirmUpdate: PAGES.profileUpdateNameConfirmUpdate,
  success: PAGES.profileUpdateNameSuccess,
};

export default function EditProfileNamePage() {
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";
  const { state, dispatch } = useUser();
  const navigate = useNavigate();

  const [wizardStep, setWizardStep] =
    useState<ProfileNameWizardStep>("editName");
  const [errorCode, setErrorCode] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [nameFormData, setNameFormData] = useState<ProfileNameFormData>(
    normalizeNameFormData(state?.userProfile?.name),
  );

  // Initialize form tracking
  const { trackEvent } = useFormTracking({
    formId: PROFILE_NAME_ANALYTICS.FLOW_ID,
  });

  const { t } = useTranslation(["security", "common"]);

  const { updateProfileSuccess } = userProfileDispatch(dispatch);
  const backToProfile = path(PAGES.ProfileHome, { language: routeLanguage });

  useEffect(() => {
    if (wizardStep === "editName") {
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_START,
        step: PROFILE_NAME_ANALYTICS.STEPS.EDIT_NAME,
      });
    }
  }, [wizardStep, trackEvent]);

  useWizardPageTracking(wizardStep, PROFILE_NAME_PAGE_BY_STEP);

  const handleNameFormChange = <TField extends keyof ProfileNameFormData>(
    field: TField,
    value: ProfileNameFormData[TField],
  ) => {
    setNameFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmitNameForm = () => {
    const givenName = (nameFormData.givenName ?? "")
      .trim()
      .replace(/\s+/g, " ");
    const familyName = (nameFormData.familyName ?? "")
      .trim()
      .replace(/\s+/g, " ");
    const formatted = `${givenName} ${familyName}`.trim();

    setNameFormData((previous) => ({
      ...previous,
      givenName,
      familyName,
      formatted,
    }));

    setWizardStep("confirmUpdate");
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
      step: PROFILE_NAME_ANALYTICS.STEPS.CONFIRM_UPDATE,
    });
  };

  const saveUpdatedProfileData = async () => {
    try {
      setLocalLoading(true);
      setErrorCode("");

      const response = (await authService.update_my_user_profile({
        name: nameFormData,
        user_id: state.userProfile?.id,
      })) as AuthServiceResponse<UserProfile>;

      if (response?.data) {
        updateProfileSuccess(response.data);
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: PROFILE_NAME_ANALYTICS.STEPS.SUCCESS,
        });
        setWizardStep("success");
      } else {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: PROFILE_NAME_ANALYTICS.STEPS.CONFIRM_UPDATE,
          error: "PROFILE_UPDATE_FAILED",
        });
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (message) {
        setErrorCode(message);
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: PROFILE_NAME_ANALYTICS.STEPS.CONFIRM_UPDATE,
          error: message,
        });
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleBackToProfile = () => {
    navigate(backToProfile);
  };

  let errorMessage = errorCode
    ? t(`Error.${errorCode}`, { ns: "common", defaultValue: "" }) || errorCode
    : "";

  const steps: Record<ProfileNameWizardStep, ReactNode> = {
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
        onConfirm={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT,
            step: PROFILE_NAME_ANALYTICS.STEPS.CONFIRM_UPDATE,
          });
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: PROFILE_NAME_ANALYTICS.STEPS.CONFIRM_UPDATE,
          });
          return saveUpdatedProfileData();
        }}
        onCancel={handleBackToProfile}
        onBack={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: PROFILE_NAME_ANALYTICS.STEPS.EDIT_NAME,
          });
          setWizardStep("editName");
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
    <Loader text={t("OtpSelection.loading")} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={routeLanguage}
    />
  );
}
