import { Navigate } from "react-router";

import RootLayout from "./components/Layout/RootLayout.jsx";
import {
  PrivateRoute,
  StepupPrivateRoute,
} from "./components/Providers/PrivateRoute.jsx";
import { UserProvider } from "./components/Providers/UserProvider";
import { LanguageProvider } from "./components/Providers/LanguageProvider";
import { AppLanguageSetup } from "./components/Providers/AppLanguageSetup";

import ManageDashboard from "./components/Manage/ManageDashboard.jsx";
import Verification from "./components/Verification/Verification.jsx";
import ChangePasswordIndex from "./features/ChangePassword/components/ChangePasswordIndex.jsx";
import ProfileUpdateName from "./components/PersonalInfo/ProfileUpdateName.jsx";
import ProfileHome from "./components/Manage/ProfileHome.jsx";
import CheckYourEmail from "./components/Manage/CheckYourEmail.jsx";
import CompleteTwoStepVerification from "./components/Manage/CompleteTwoStepVerification.jsx";
import FirstVerifyItsYou from "./components/Manage/FirstVerifyItsYou.jsx";
import EnterNewEmail from "./components/Manage/EnterNewEmail.jsx";
import ProfileUpdateNameSuccess from "./components/Manage/ProfileUpdateNameSuccess.jsx";
import AreYouSureUpdateContactNumber from "./components/Manage/AreYouSureUpdateContactNumber.jsx";
import EnterNewPhoneNumber from "./components/Manage/EnterNewPhoneNumber.jsx";
import YouMayUpdateEmailAtOtherPlaces from "./components/Manage/YouMayUpdateEmailAtOtherPlaces.jsx";
import AreYouSureUpdateYourEmail from "./components/Manage/AreYouSureUpdateYourEmail.jsx";
import SecuritySettings from "./components/Manage/SecuritySettings.jsx";
import EditLanguagePreferences from "./components/Manage/EditLanguagePreferences.jsx";
import AreYouSureEditYourLanguage from "./components/Manage/AreYouSureEditYourLanguage.jsx";
import ProfileYouMayUpdateLanguage from "./components/Manage/ProfileYouMayUpdateLanguage.jsx";
import { PAGES } from "./utils/constants.jsx";
import ProfileUpdateNameConfirmUpdate from "./components/Manage/ProfileUpdateNameConfirmUpdate.jsx";

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
                ],
              },
              {
                path: "areYouSureUpdateContactNumber",
                element: <AreYouSureUpdateContactNumber />,
                handle: { id: PAGES.areYouSureUpdateContactNumber },
              },
              {
                path: "enterNewPhoneNumber",
                element: <EnterNewPhoneNumber />,
                handle: { id: PAGES.enterNewPhoneNumber },
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
