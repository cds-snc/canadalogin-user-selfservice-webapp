import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router";

import { useUser } from "../../../components/Providers/useUser";
import { getPageContent } from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { authService } from "../../../services/authService";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import { useFormTracking } from "../../../hooks/useFormTracking";
import StepContent from "../../../components/Wizard/StepContent";
import Loader from "../../../components/Layout/Loading";
import ConfirmUpdate from "./ConfirmUpdate";
import ProfileUpdateName from "./ProfileUpdateName";
import SuccessfullyUpdated from "./SuccessfullyUpdated";
import type {
  ProfileNameFormData,
  ProfileNamePageContent,
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
  const { trackStepChange, trackStepAttempt, trackStepError, trackApiCall } =
    useFormTracking({
      formId: "profile_name_update",
      page: "edit_name",
      initialStep: wizardStep,
    });

  const loaderPageContentJson =
    (getPageContent(routeLanguage, PAGES.otpSelection) as
      | ProfileNamePageContent
      | undefined) ?? {};
  const errorPageJson =
    (getPageContent(routeLanguage, PAGES.error) as
      | ProfileNamePageContent
      | undefined) ?? {};

  const { updateProfileSuccess } = userProfileDispatch(dispatch);
  const backToProfile = path(PAGES.ProfileHome, { language: routeLanguage });

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
    trackStepChange("confirmUpdate", "verify");
  };

  const saveUpdatedProfileData = async () => {
    try {
      setLocalLoading(true);
      setErrorCode("");

      trackStepAttempt("profile_update_submit_initiated", "update");

      const response = await trackApiCall(
        "update_my_user_profile",
        "PATCH",
        async () => {
          const result = await authService.update_my_user_profile({
            name: nameFormData,
            user_id: state.userProfile?.id,
          });
          return result as AuthServiceResponse<UserProfile>;
        },
        "update"
      );

      if (response?.data) {
        updateProfileSuccess(response.data);
        setWizardStep("success");
        trackStepChange("success", "update");
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (message) {
        setErrorCode(message);
        trackStepError(`profile_update_failed: ${message}`, "update");
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
        onConfirm={saveUpdatedProfileData}
        onCancel={handleBackToProfile}
        onBack={() => {
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
    <Loader text={loaderPageContentJson["11"]} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={routeLanguage}
    />
  );
}
