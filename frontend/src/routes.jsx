import { Navigate } from "react-router";

import RootLayout from "./components/Layout/RootLayout.jsx";
import { AppLanguageSetup } from "./components/Providers/AppLanguageSetup";
import { LanguageProvider } from "./components/Providers/LanguageProvider";
import {
  PrivateRoute,
  StepupPrivateRoute,
} from "./components/Providers/PrivateRoute.jsx";
import { UserProvider } from "./components/Providers/UserProvider";

import AreYouSureEditYourLanguage from "./components/Manage/AreYouSureEditYourLanguage.jsx";
import AreYouSureUpdateContactNumber from "./components/Manage/AreYouSureUpdateContactNumber.jsx";
import AreYouSureUpdateYourEmail from "./components/Manage/AreYouSureUpdateYourEmail.jsx";
import CheckYourEmail from "./components/Manage/CheckYourEmail.jsx";
import CompleteTwoStepVerification from "./components/Manage/CompleteTwoStepVerification.jsx";
import EditLanguagePreferences from "./components/Manage/EditLanguagePreferences.jsx";
import EnterNewEmail from "./components/Manage/EnterNewEmail.jsx";
import FirstVerifyItsYou from "./components/Manage/FirstVerifyItsYou.jsx";
import ManageDashboard from "./components/Manage/ManageDashboard.jsx";
import ProfileHome from "./components/Manage/ProfileHome.jsx";
import ProfileUpdateNameConfirmUpdate from "./components/Manage/ProfileUpdateNameConfirmUpdate.jsx";
import ProfileUpdateNameSuccess from "./components/Manage/ProfileUpdateNameSuccess.jsx";
import ProfileYouMayUpdateLanguage from "./components/Manage/ProfileYouMayUpdateLanguage.jsx";
import Manage2FAVerifications from "./components/Manage/SecuritySettings/Manage2FAVerifications.jsx";
import SecuritySettings from "./components/Manage/SecuritySettings/SecuritySettings.jsx";
import YouMayUpdateEmailAtOtherPlaces from "./components/Manage/YouMayUpdateEmailAtOtherPlaces.jsx";
import ProfileUpdateName from "./components/PersonalInfo/ProfileUpdateName.jsx";
import Verification from "./components/Verification/Verification.jsx";
import ChangePasswordIndex from "./features/ChangePassword/components/ChangePasswordIndex.jsx";
import UpdateContactPhoneNumberContainer from "./features/ContactPhoneNumber/components/UpdateContactPhoneNumberContainer.jsx";
import Add2FAPage from "./features/Manage2FA/Add2FA/component/Add2FAPage.jsx";
import { PAGES } from "./utils/constants.jsx";

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
      {
        element: <RootLayout />,
        children: [
          { path: "/", element: <Navigate to="/en" replace /> },
          {
            path: "/:language",
            handle: { id: PAGES.manageDashboard, breadcrumbId: "4" },
            children: [
              {
                index: true,
                element: <ManageDashboard />,
              },
              {
                path: "checkyouremail",
                element: <CheckYourEmail />,
                handle: { id: PAGES.CheckYourEmail },
              },
              {
                path: "completetwostepverification",
                element: <CompleteTwoStepVerification />,
                handle: { id: PAGES.CompleteTwoStepVerification },
              },
              {
                path: "firstverifyitsyou",
                element: <FirstVerifyItsYou />,
                handle: { id: PAGES.FirstVerifyItsYou },
              },
              {
                path: "enternewemail",
                element: <EnterNewEmail />,
                handle: { id: PAGES.EnterNewEmail },
              },
              {
                path: "profile",
                handle: { id: PAGES.ProfileHome, breadcrumbId: "2" },
                children: [
                  {
                    index: true,
                    element: <ProfileHome />,
                  },
                  {
                    path: "update-name",
                    element: <ProfileUpdateName />,
                    handle: { id: PAGES.profileUpdateName },
                  },
                  {
                    path: "update-name/success",
                    element: <ProfileUpdateNameSuccess />,
                    handle: { id: PAGES.profileUpdateNameSuccess },
                  },
                  {
                    path: "update-name/confirm-update",
                    element: <ProfileUpdateNameConfirmUpdate />,
                    handle: { id: PAGES.profileUpdateNameConfirmUpdate },
                  },
                  {
                    path: "update-language",
                    element: <EditLanguagePreferences />,
                    handle: { id: PAGES.editLanguagePreferences },
                  },
                  {
                    path: "update-language/success",
                    element: <ProfileYouMayUpdateLanguage />,
                    handle: { id: PAGES.profileYouMayUpdateLanguage },
                  },
                  {
                    path: "update-language/confirm-update",
                    element: <AreYouSureEditYourLanguage />,
                    handle: { id: PAGES.areYouSureEditYourLanguage },
                  },
                  {
                    path: "update-contact-phone-number",
                    element: <UpdateContactPhoneNumberContainer />,
                    handle: { id: PAGES.enterNewPhoneNumber },
                  },
                ],
              },
              {
                path: "areYouSureUpdateContactNumber",
                element: <AreYouSureUpdateContactNumber />,
                handle: { id: PAGES.areYouSureUpdateContactNumber },
              },
              {
                path: "youMayUpdateEmailAtOtherPlaces",
                element: <YouMayUpdateEmailAtOtherPlaces />,
                handle: { id: PAGES.youMayUpdateEmailAtOtherPlaces },
              },
              {
                path: "areYouSureUpdateYourEmail",
                element: <AreYouSureUpdateYourEmail />,
                handle: { id: PAGES.areYouSureUpdateYourEmail },
              },
              {
                path: "security-settings",
                handle: { id: PAGES.securitySettings, breadcrumbId: "11" },
                children: [
                  {
                    index: true,
                    element: <SecuritySettings />,
                  },
                  {
                    element: <StepupPrivateRoute />,
                    children: [
                      {
                        path: "update-password",
                        element: <ChangePasswordIndex />,
                        handle: { id: PAGES.password },
                      },
                    ],
                  },
                  {
                    path: "manage-2fa-verifications",
                    element: <Manage2FAVerifications />,
                    handle: { id: PAGES.manage2FAVerifications },
                  },
                  {
                    path: "add-2fa",
                    element: <Add2FAPage />,
                    handle: { id: PAGES.add2FA },
                  },
                ],
              },
              {
                path: "verification",
                element: <Verification />,
                handle: { id: PAGES.verification },
              },
            ],
          },
          { path: "*", element: <ManageDashboard /> },
        ],
      },
    ],
  },
];
