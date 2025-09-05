import { Routes, Route, Navigate } from "react-router";
import {
  PrivateRoute,
  StepupPrivateRoute,
} from "./components/Providers/PrivateRoute.jsx";
import { Routes, Route, Navigate } from "react-router";
import {
  PrivateRoute,
  StepupPrivateRoute,
} from "./components/Providers/PrivateRoute.jsx";
import Page from "./views/Page.js";
import { PAGES, NAVIGATION_LINKS } from "./utils/constants.jsx";

function App() {
  // Create dynamic routes using template literals with NAVIGATION_LINKS
  const editLanguagePreferences = `/:language${NAVIGATION_LINKS.editLanguagePreferences}`;
  const areYouSureEditYourLanguage = `/:language${NAVIGATION_LINKS.areYouSureEditYourLanguage}`;
  const profileYouMayUpdateLanguage = `/:language${NAVIGATION_LINKS.profileYouMayUpdateLanguage}`;
  const newPasswordPage = `/:language${NAVIGATION_LINKS.password}`;
  const profileNameEdit = `/:language${NAVIGATION_LINKS.ProfileNameEdit}`;
  const profileHome = `/:language${NAVIGATION_LINKS.profileHome}`;
  const checkYourEmail = `/:language${NAVIGATION_LINKS.checkYourEmail}`;
  const completeTwoStepVerification = `/:language${NAVIGATION_LINKS.completeTwoStepVerification}`;
  const firstVerifyItsYou = `/:language${NAVIGATION_LINKS.firstVerifyItsYou}`;
  const enterNewEmail = `/:language${NAVIGATION_LINKS.enterNewEmail}`;
  const profileYouMayUpdateName = `/:language${NAVIGATION_LINKS.profileYouMayUpdateName}`;
  const areYouSureUpdateContactNumber = `/:language${NAVIGATION_LINKS.areYouSureUpdateContactNumber}`;
  const areYouSureEditYourName = `/:language${NAVIGATION_LINKS.areYouSureEditYourName}`;
  const enterNewPhoneNumber = `/:language${NAVIGATION_LINKS.enterNewPhoneNumber}`;
  const youMayUpdateEmailAtOtherPlaces = `/:language${NAVIGATION_LINKS.youMayUpdateEmailAtOtherPlaces}`;
  const areYouSureUpdateYourEmail = `/:language${NAVIGATION_LINKS.areYouSureUpdateYourEmail}`;
  const securitySettings = `/:language${NAVIGATION_LINKS.securitySettings}`;
  const verification = `/:language${NAVIGATION_LINKS.verification}`;

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
        
        {/* Routes */}
        <Route path={profileNameEdit} element={<Page page={PAGES.ProfileNameEdit} />} />
        <Route path={profileHome} element={<Page page={PAGES.ProfileHome} />} />
        <Route path={checkYourEmail} element={<Page page={PAGES.CheckYourEmail} />} />
        <Route path={completeTwoStepVerification} element={<Page page={PAGES.CompleteTwoStepVerification} />} />
        <Route path={firstVerifyItsYou} element={<Page page={PAGES.FirstVerifyItsYou} />} />
        <Route path={enterNewEmail} element={<Page page={PAGES.EnterNewEmail} />} />
        <Route path={profileYouMayUpdateName} element={<Page page={PAGES.profileYouMayUpdateName} />} />
        <Route path={areYouSureUpdateContactNumber} element={<Page page={PAGES.areYouSureUpdateContactNumber} />} />
        <Route path={areYouSureEditYourName} element={<Page page={PAGES.areYouSureEditYourName} />} />
        <Route path={enterNewPhoneNumber} element={<Page page={PAGES.enterNewPhoneNumber} />} />
        <Route path={youMayUpdateEmailAtOtherPlaces} element={<Page page={PAGES.youMayUpdateEmailAtOtherPlaces} />} />
        <Route path={areYouSureUpdateYourEmail} element={<Page page={PAGES.areYouSureUpdateYourEmail} />} />
        <Route path={securitySettings} element={<Page page={PAGES.securitySettings} />} />
        <Route path={verification} element={<Page page={PAGES.verification} />} />
        <Route path={editLanguagePreferences} element={<Page page={PAGES.editLanguagePreferences} />} />
        <Route path={areYouSureEditYourLanguage} element={<Page page={PAGES.areYouSureEditYourLanguage} />} />
        <Route path={profileYouMayUpdateLanguage} element={<Page page={PAGES.profileYouMayUpdateLanguage} />} />

        <Route element={<StepupPrivateRoute />}>
          <Route path={newPasswordPage} element={<Page page={PAGES.updatePassword} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
export default App;
