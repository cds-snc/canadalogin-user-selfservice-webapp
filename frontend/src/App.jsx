import { Routes, Route, Navigate } from "react-router";
import {
  PrivateRoute,
  StepupPrivateRoute,
} from "./components/Providers/PrivateRoute.jsx";
import Page from "./views/Page.js";
import { PAGES, NAVIGATION_LINKS } from "./utils/constants.jsx";

function App() {
  // Create dynamic routes using template literals with NAVIGATION_LINKS
  
  // Profile Update Name Routes
  const profileUpdateName = `/:language${NAVIGATION_LINKS.profileUpdateName}`;
  const profileUpdateNameConfirmUpdate = `/:language${NAVIGATION_LINKS.profileUpdateNameConfirmUpdate}`;
  const profileUpdateNameSuccess = `/:language${NAVIGATION_LINKS.profileUpdateNameSuccess}`;
  
  // Profile Update Language Routes
  const profileUpdateLanguage = `/:language${NAVIGATION_LINKS.profileUpdateLanguage}`;
  const profileUpdateLanguageConfirmUpdate = `/:language${NAVIGATION_LINKS.profileUpdateLanguageConfirmUpdate}`;
  const profileUpdateLanguageSuccess = `/:language${NAVIGATION_LINKS.profileUpdateLanguageSuccess}`;
  
  // Other Routes
  const profileHome = `/:language${NAVIGATION_LINKS.profileHome}`;
  const securitySettings = `/:language${NAVIGATION_LINKS.securitySettings}`;
  const securitySettingsUpdatePassword = `/:language${NAVIGATION_LINKS.securitySettingsUpdatePassword}`;
  const verification = `/:language${NAVIGATION_LINKS.verification}`;
  const checkYourEmail = `/:language${NAVIGATION_LINKS.checkYourEmail}`;
  const completeTwoStepVerification = `/:language${NAVIGATION_LINKS.completeTwoStepVerification}`;
  const firstVerifyItsYou = `/:language${NAVIGATION_LINKS.firstVerifyItsYou}`;
  const enterNewEmail = `/:language${NAVIGATION_LINKS.enterNewEmail}`;
  const areYouSureUpdateContactNumber = `/:language${NAVIGATION_LINKS.areYouSureUpdateContactNumber}`;
  const enterNewPhoneNumber = `/:language${NAVIGATION_LINKS.enterNewPhoneNumber}`;
  const youMayUpdateEmailAtOtherPlaces = `/:language${NAVIGATION_LINKS.youMayUpdateEmailAtOtherPlaces}`;
  const areYouSureUpdateYourEmail = `/:language${NAVIGATION_LINKS.areYouSureUpdateYourEmail}`;

  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Page page={PAGES.manageDashboard} />} />
        <Route
          path="/:language"
          element={<Page page={PAGES.manageDashboard} />}
        />
        <Route
          path="/:language/"
          element={<Page page={PAGES.manageDashboard} />}
        />
        
        {/* Dashboard Routes */}
        <Route path={profileHome} element={<Page page={PAGES.ProfileHome} />} />
        
        {/* Profile Update Name Routes */}
        <Route path={profileUpdateName} element={<Page page={PAGES.ProfileNameEdit} />} />
        <Route path={profileUpdateNameConfirmUpdate} element={<Page page={PAGES.profileUpdateNameConfirmUpdate} />} />
        <Route path={profileUpdateNameSuccess} element={<Page page={PAGES.profileUpdateNameSuccess} />} />
        
        {/* Profile Update Language Routes */}
        <Route path={profileUpdateLanguage} element={<Page page={PAGES.editLanguagePreferences} />} />
        <Route path={profileUpdateLanguageConfirmUpdate} element={<Page page={PAGES.areYouSureEditYourLanguage} />} />
        <Route path={profileUpdateLanguageSuccess} element={<Page page={PAGES.profileYouMayUpdateLanguage} />} />
        
        {/* Security and Verification Routes */}
        <Route path={securitySettings} element={<Page page={PAGES.securitySettings} />} />
        <Route path={verification} element={<Page page={PAGES.verification} />} />
        <Route path={checkYourEmail} element={<Page page={PAGES.CheckYourEmail} />} />
        <Route path={completeTwoStepVerification} element={<Page page={PAGES.CompleteTwoStepVerification} />} />
        <Route path={firstVerifyItsYou} element={<Page page={PAGES.FirstVerifyItsYou} />} />
        
        {/* Contact Information Routes */}
        <Route path={enterNewEmail} element={<Page page={PAGES.EnterNewEmail} />} />
        <Route path={areYouSureUpdateYourEmail} element={<Page page={PAGES.areYouSureUpdateYourEmail} />} />
        <Route path={youMayUpdateEmailAtOtherPlaces} element={<Page page={PAGES.youMayUpdateEmailAtOtherPlaces} />} />
        <Route path={enterNewPhoneNumber} element={<Page page={PAGES.enterNewPhoneNumber} />} />
        <Route path={areYouSureUpdateContactNumber} element={<Page page={PAGES.areYouSureUpdateContactNumber} />} />

        <Route element={<StepupPrivateRoute />}>
          <Route path={securitySettingsUpdatePassword} element={<Page page={PAGES.updatePassword} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
export default App;
