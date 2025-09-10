import RootLayout from "./components/Layout/RootLayout.jsx";
import { PrivateRoute, StepupPrivateRoute } from "./components/Providers/PrivateRoute.jsx";
import { UserProvider } from "./components/Providers/UserProvider";
import { LanguageProvider } from "./components/Providers/LanguageProvider";
import { AppLanguageSetup } from "./components/Providers/AppLanguageSetup";

import ManageDashboard from "./components/Manage/ManageDashboard.jsx";
import Verification from "./components/Verification/Verification.jsx";
import ChangePasswordIndex from "./features/ChangePassword/components/ChangePasswordIndex.jsx";
import AreYouSureEditYourName from "./components/Manage/AreYouSureEditYourName.jsx";
import ProfileNameEdit from "./components/PersonalInfo/ProfileNameEdit.jsx";
import ProfileHome from "./components/Manage/ProfileHome.jsx";
import CheckYourEmail from "./components/Manage/CheckYourEmail.jsx";
import CompleteTwoStepVerification from "./components/Manage/CompleteTwoStepVerification.jsx";
import FirstVerifyItsYou from "./components/Manage/FirstVerifyItsYou.jsx";
import EnterNewEmail from "./components/Manage/EnterNewEmail.jsx";
import ProfileYouMayUpdateName from "./components/Manage/ProfileYouMayUpdateName.jsx";
import AreYouSureUpdateContactNumber from "./components/Manage/AreYouSureUpdateContactNumber.jsx";
import EnterNewPhoneNumber from "./components/Manage/EnterNewPhoneNumber.jsx";
import YouMayUpdateEmailAtOtherPlaces from "./components/Manage/YouMayUpdateEmailAtOtherPlaces.jsx";
import AreYouSureUpdateYourEmail from "./components/Manage/AreYouSureUpdateYourEmail.jsx";
import SecuritySettings from "./components/Manage/SecuritySettings.jsx";
import EditLanguagePreferences from "./components/Manage/EditLanguagePreferences.jsx";
import AreYouSureEditYourLanguage from "./components/Manage/AreYouSureEditYourLanguage.jsx";
import ProfileYouMayUpdateLanguage from "./components/Manage/ProfileYouMayUpdateLanguage.jsx";

export const appRoutes = [
  {
    element: (
      <UserProvider>
        <LanguageProvider>
          <AppLanguageSetup />
          <PrivateRoute />
        </LanguageProvider>
      </UserProvider>
    ),
    children: [
      { element: <RootLayout />, children: [
        { path: "/", element: <ManageDashboard />, handle: { id: "ManageDashboard" } },
        {
          path: ":language",
          children: [
            { index: true, element: <ManageDashboard />, handle: { id: "ManageDashboard" } },
            { path: "profile-home", element: <ProfileHome />, handle: { id: "ProfileHome" } },
            { path: "checkyouremail", element: <CheckYourEmail />, handle: { id: "CheckYourEmail" } },
            { path: "completetwostepverification", element: <CompleteTwoStepVerification /> },
            { path: "firstverifyitsyou", element: <FirstVerifyItsYou /> },
            { path: "enternewemail", element: <EnterNewEmail /> },
            {
              path: "profile",
              children: [
                { path: "update-name", element: <ProfileNameEdit /> },
                { path: "update-name/success", element: <ProfileYouMayUpdateName /> },
                { path: "update-name/confirm-update", element: <AreYouSureEditYourName /> },
                { path: "update-language", element: <EditLanguagePreferences /> },
                { path: "update-language/success", element: <ProfileYouMayUpdateLanguage /> },
                { path: "update-language/confirm-update", element: <AreYouSureEditYourLanguage /> },
              ],
            },
            { path: "areYouSureUpdateContactNumber", element: <AreYouSureUpdateContactNumber /> },
            { path: "enterNewPhoneNumber", element: <EnterNewPhoneNumber /> },
            { path: "youMayUpdateEmailAtOtherPlaces", element: <YouMayUpdateEmailAtOtherPlaces /> },
            { path: "areYouSureUpdateYourEmail", element: <AreYouSureUpdateYourEmail /> },
            {
              path: "security-settings",
              children: [
                { index: true, element: <SecuritySettings /> },
                {
                  element: <StepupPrivateRoute />,
                  children: [
                    { path: "update-password", element: <ChangePasswordIndex /> },
                  ],
                },
              ],
            },
            { path: "verification", element: <Verification /> },
          ],
        },
        { path: "*", element: <ManageDashboard /> },
      ]
    }],
  },
];
