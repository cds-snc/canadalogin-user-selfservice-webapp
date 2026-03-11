import React from "react";
import { PAGES } from "../../../utils/constants";

// Import all the components that were previously handled by the Page component
import ManageDashboard from "../../../components/Manage/ManageDashboard";
import ProfileHome from "../../../components/Manage/ProfileHome";
import EditProfileNamePage from "../../../features/ProfileName/components/EditProfileNamePage.jsx";
import EditLanguagePreferencePage from "../../../features/LanguagePreference/components/EditLanguagePreferencePage.jsx";
import SecuritySettings from "../../../components/Manage/SecuritySettings/SecuritySettings";
import Manage2FAVerifications from "../../../components/Manage/SecuritySettings/Manage2FAVerifications";
import EditLanguagePreferences from "../../../features/LanguagePreference/components/EditLanguagePreferences.jsx";
import ConfirmLanguageUpdate from "../../../features/LanguagePreference/components/ConfirmUpdate.jsx";
import SuccessfullyUpdatedLanguage from "../../../features/LanguagePreference/components/SuccessfullyUpdated.jsx";
import DeleteMFAPage from "../../../features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPage.jsx";
import DeleteMFAPhoneNumberConfirm from "../../../features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPhoneNumberConfirm.jsx";
import AddMFAPage from "../../../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPage.jsx";
import AddMFAPhoneNumber from "../../../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPhoneNumber.jsx";
import EditContactPhoneNumberPage from "../../../features/ContactPhoneNumber/components/EditContactPhoneNumberPage";
import ChangePasswordIndex from "../../../features/ChangePassword/components/ChangePasswordIndex.jsx";
import EditEmailAddressPage from "../../../features/EmailAddress/EditEmailAddressPage";
import DeleteFIDO2PasskeyPage from "../../../features/ManageFIDO2/components/DeleteFIDO2Passkey/DeleteFIDO2PasskeyPage.jsx";
import AddFIDO2PasskeyPage from "../../../features/ManageFIDO2/components/AddFIDO2Passkey/AddFIDO2PasskeyPage.jsx";

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
    case PAGES.password:
      return <ChangePasswordIndex />;
    case PAGES.editEmailPage:
      return <EditEmailAddressPage />;
    case PAGES.deleteFIDO2PasskeyPage:
      return <DeleteFIDO2PasskeyPage />;
    case PAGES.addFIDO2PasskeyPage:
      return <AddFIDO2PasskeyPage />;
    default:
      console.warn(`Unknown page in Storybook: ${page}`);
      return <div>Storybook: Page not found: {page}</div>;
  }
};

export default PageRenderer;
