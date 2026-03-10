import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { getPageContent } from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { authService } from "../../../services/authService";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import StepContent from "../../../components/Wizard/StepContent.jsx";
import Loader from "../../../components/Layout/Loading.jsx";
import ProfileUpdateName from "./ProfileUpdateName.jsx";
import ConfirmUpdate from "./ConfirmUpdate.jsx";
import SuccessfullyUpdated from "./SuccessfullyUpdated.jsx";

export default function EditProfileNamePage() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const navigate = useNavigate();

  const [wizardStep, setWizardStep] = useState("editName");
  const [errorCode, setErrorCode] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [nameFormData, setNameFormData] = useState(
    state?.userProfile?.name || {
      givenName: "",
      familyName: "",
      formatted: "",
    },
  );

  const loaderPageContentJson = getPageContent(language, PAGES.otpSelection);
  const errorPageJson = getPageContent(language, PAGES.error);

  const { updateProfileSuccess } = userProfileDispatch(dispatch);
  const backToProfile = path(PAGES.ProfileHome, { language: language });

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
  };

  const saveUpdatedProfileData = async () => {
    try {
      setLocalLoading(true);
      const response = await authService.update_my_user_profile({
        name: nameFormData,
        user_id: state.userProfile.id,
      });
      updateProfileSuccess(response.data);
      setWizardStep("success");
      setErrorCode("");
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
