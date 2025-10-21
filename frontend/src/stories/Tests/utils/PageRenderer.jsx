import React from "react";
import { PAGES } from "../../../utils/constants.jsx";

// Import all the components that were previously handled by the Page component
import ManageDashboard from "../../../components/Manage/ManageDashboard.jsx";
import ProfileHome from "../../../components/Manage/ProfileHome.jsx";
import CheckYourEmail from "../../../components/Manage/CheckYourEmail.jsx";
import CompleteTwoStepVerification from "../../../components/Manage/CompleteTwoStepVerification.jsx";
import FirstVerifyItsYou from "../../../components/Manage/FirstVerifyItsYou.jsx";
import EnterNewEmail from "../../../components/Manage/EnterNewEmail.jsx";
import ProfileUpdateNameSuccess from "../../../features/ProfileName/components/SuccessfullyUpdated.jsx";
import ProfileUpdateNameConfirmUpdate from "../../../features/ProfileName/components/ConfirmUpdate.jsx";
import AreYouSureUpdateContactNumber from "../../../components/Manage/AreYouSureUpdateContactNumber.jsx";
import EnterNewPhoneNumber from "../../../components/Manage/EnterNewPhoneNumber.jsx";
import YouMayUpdateEmailAtOtherPlaces from "../../../components/Manage/YouMayUpdateEmailAtOtherPlaces.jsx";
import AreYouSureUpdateYourEmail from "../../../components/Manage/AreYouSureUpdateYourEmail.jsx";
import SecuritySettings from "../../../components/Manage/SecuritySettings/SecuritySettings.jsx";
import Manage2FAVerifications from "../../../components/Manage/SecuritySettings/Manage2FAVerifications.jsx";
import EditLanguagePreferences from "../../../features/LanguagePreference/components/EditLanguagePreferences.jsx";
import ConfirmLanguageUpdate from "../../../features/LanguagePreference/components/ConfirmUpdate.jsx";
import SuccessfullyUpdatedLanguage from "../../../features/LanguagePreference/components/SuccessfullyUpdated.jsx";
import ProfileUpdateName from "../../../features/ProfileName/components/ProfileUpdateName.jsx";
import Verification from "../../../components/Verification/Verification.jsx";
import DeleteMFAPage from "../../../features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPage.jsx";
import DeleteMFAPhoneNumberConfirm from "../../../features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPhoneNumberConfirm.jsx";

// Storybook Page Renderer - maps page names to components for testing
const PageRenderer = ({ page, ...props }) => {
  switch (page) {
    case PAGES.manageDashboard:
      return <ManageDashboard />;
    case PAGES.ProfileHome:
      return <ProfileHome />;
    case PAGES.CheckYourEmail:
      return <CheckYourEmail />;
    case PAGES.CompleteTwoStepVerification:
      return <CompleteTwoStepVerification />;
    case PAGES.FirstVerifyItsYou:
      return <FirstVerifyItsYou />;
    case PAGES.EnterNewEmail:
      return <EnterNewEmail />;
    // case PAGES.profileUpdateNameSuccess:
    //   return <ProfileUpdateNameSuccess />;
    // case PAGES.profileUpdateNameConfirmUpdate:
    //   return <ProfileUpdateNameConfirmUpdate />;
    // case PAGES.profileUpdateName:
    //   return <ProfileUpdateName />;
    case PAGES.areYouSureUpdateContactNumber:
      return <AreYouSureUpdateContactNumber />;
    case PAGES.enterNewPhoneNumber:
      return <EnterNewPhoneNumber />;
    case PAGES.youMayUpdateEmailAtOtherPlaces:
      return <YouMayUpdateEmailAtOtherPlaces />;
    case PAGES.areYouSureUpdateYourEmail:
      return <AreYouSureUpdateYourEmail />;
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
    default:
      console.warn(`Unknown page in Storybook: ${page}`);
      return <div>Storybook: Page not found: {page}</div>;
  }
};

export default PageRenderer;
