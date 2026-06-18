import React from "react";
import { PAGES } from "../../../utils/constants";

// Import all the components that were previously handled by the Page component
import ManageDashboard from "../../../components/Manage/ManageDashboard";
import ProfileHome from "../../../components/Manage/ProfileHome";
import EditProfileNamePage from "../../../features/ProfileName/components/EditProfileNamePage";
import EditLanguagePreferencePage from "../../../features/LanguagePreference/components/EditLanguagePreferencePage";
import SecuritySettings from "../../../components/Manage/SecuritySettings/SecuritySettings";
import Manage2FAVerifications from "../../../components/Manage/SecuritySettings/Manage2FAVerifications";
import EditLanguagePreferences from "../../../features/LanguagePreference/components/EditLanguagePreferences";
import ConfirmLanguageUpdate from "../../../features/LanguagePreference/components/ConfirmUpdate";
import SuccessfullyUpdatedLanguage from "../../../features/LanguagePreference/components/SuccessfullyUpdated";
import DeleteMFAPage from "../../../features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPage";
import DeleteMFAPhoneNumberConfirm from "../../../features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPhoneNumberConfirm";
import AddMFAPage from "../../../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPage";
import AddMFAPhoneNumber from "../../../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPhoneNumber";
import EditContactPhoneNumberPage from "../../../features/ContactPhoneNumber/components/EditContactPhoneNumberPage";
import ChangePasswordIndex from "../../../features/ChangePassword/components/ChangePasswordIndex";
import EditEmailAddressPage from "../../../features/EmailAddress/EditEmailAddressPage";
import DeleteFIDO2PasskeyPage from "../../../features/ManageFIDO2/components/DeleteFIDO2Passkey/DeleteFIDO2PasskeyPage";
import AddFIDO2PasskeyPage from "../../../features/ManageFIDO2/components/AddFIDO2Passkey/AddFIDO2PasskeyPage";
import ServiceCanadaCentrePage from "../../../features/IDV/InPerson/ServiceCanadaCentrePage";
import ServiceCanadaCentreIDVCodePage from "../../../features/IDV/InPerson/ServiceCanadaCentreIDVCodePage";
import ProofingBarcodeCanadaPostPage from "../../../features/IDV/InPerson/ProofingBarcodeCanadaPostPage";
import StartIdentityProofingPage from "../../../features/IDV/StartIdentityProofingPage";
import ProvenInformationCard from "../../../features/IDV/ProvenInformationCard";

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
    case PAGES.idvServiceCanadaCentrePage:
      return <ServiceCanadaCentrePage />;
    case PAGES.idvServiceCanadaCentreCodePage:
      return <ServiceCanadaCentreIDVCodePage />;
    case PAGES.idvProofingBarcodeCanadaPostPage:
      return <ProofingBarcodeCanadaPostPage />;
    case PAGES.idvProvenInformationCard:
      return <ProvenInformationCard />;
    case PAGES.startIdentityProofingPage:
      return <StartIdentityProofingPage />;
    default:
      console.warn(`Unknown page in Storybook: ${page}`);
      return <div>Storybook: Page not found: {page}</div>;
  }
};

export default PageRenderer;
