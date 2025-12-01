import React from "react";
import { PAGES } from "../../../utils/constants.jsx";

// Import all the components that were previously handled by the Page component
import ManageDashboard from "../../../components/Manage/ManageDashboard.jsx";
import ProfileHome from "../../../components/Manage/ProfileHome.jsx";
import EditProfileNamePage from "../../../features/ProfileName/components/EditProfileNamePage.jsx";
import EditLanguagePreferencePage from "../../../features/LanguagePreference/components/EditLanguagePreferencePage.jsx";
import SecuritySettings from "../../../components/Manage/SecuritySettings/SecuritySettings.jsx";
import Manage2FAVerifications from "../../../components/Manage/SecuritySettings/Manage2FAVerifications.jsx";
import EditLanguagePreferences from "../../../features/LanguagePreference/components/EditLanguagePreferences.jsx";
import ConfirmLanguageUpdate from "../../../features/LanguagePreference/components/ConfirmUpdate.jsx";
import SuccessfullyUpdatedLanguage from "../../../features/LanguagePreference/components/SuccessfullyUpdated.jsx";
import Verification from "../../../components/Verification/Verification.jsx";
import DeleteMFAPage from "../../../features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPage.jsx";
import DeleteMFAPhoneNumberConfirm from "../../../features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPhoneNumberConfirm.jsx";
import AddMFAPage from "../../../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPage.jsx";
import AddMFAPhoneNumber from "../../../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPhoneNumber.jsx";
import EditContactPhoneNumberPage from "../../../features/ContactPhoneNumber/components/EditContactPhoneNumberPage.jsx";

// Storybook Page Renderer - maps page names to components for testing
const PageRenderer = ({ page, ...props }) => {
  switch (page) {
    case PAGES.manageDashboard:
      return <ManageDashboard />;
    case PAGES.ProfileHome:
      return <ProfileHome />;
    case PAGES.editProfileNamePage:
      return <EditProfileNamePage />;
    case PAGES.editLanguagePreferencePage:
      return <EditLanguagePreferencePage />;
    case PAGES.securitySettings:
      return <SecuritySettings />;
    case PAGES.manage2FAVerifications:
      return <Manage2FAVerifications />;
    case PAGES.editLanguagePreferences:
      return <EditLanguagePreferences />;
    case PAGES.confirmLanguageUpdate:
      return <ConfirmLanguageUpdate />;
    case PAGES.successfullyUpdatedLanguage:
      return <SuccessfullyUpdatedLanguage />;
    case PAGES.verification:
      return <Verification />;
    case PAGES.deleteMFAPage:
      return <DeleteMFAPage />;
    case PAGES.deleteMFAPhoneNumberConfirm:
      return <DeleteMFAPhoneNumberConfirm {...props} />;
    case PAGES.addMFAPage:
      return <AddMFAPage />;
    case PAGES.addMFANumber:
      return (
        <AddMFAPhoneNumber
          phoneFormData={props.phoneFormData}
          onNext={props.onNext}
          onCancel={props.onCancel}
          onChangePhoneForm={props.onChangePhoneForm}
        />
      );
    case PAGES.editContactPhoneNumberPage:
      return <EditContactPhoneNumberPage />;
    default:
      console.warn(`Unknown page in Storybook: ${page}`);
      return <div>Storybook: Page not found: {page}</div>;
  }
};

export default PageRenderer;
