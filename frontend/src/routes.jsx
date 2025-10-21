import { Navigate } from "react-router";

import RootLayout from "./components/Layout/RootLayout.jsx";
import { AppLanguageSetup } from "./components/Providers/AppLanguageSetup";
import { LanguageProvider } from "./components/Providers/LanguageProvider";
import {
  PrivateRoute,
  StepupPrivateRoute,
} from "./components/Providers/PrivateRoute.jsx";
import { UserProvider } from "./components/Providers/UserProvider";

import ConfirmLanguageUpdate from "./features/LanguagePreference/components/ConfirmUpdate.jsx";
import AreYouSureUpdateContactNumber from "./components/Manage/AreYouSureUpdateContactNumber.jsx";
import AreYouSureUpdateYourEmail from "./components/Manage/AreYouSureUpdateYourEmail.jsx";
import CheckYourEmail from "./components/Manage/CheckYourEmail.jsx";
import CompleteTwoStepVerification from "./components/Manage/CompleteTwoStepVerification.jsx";
import EditLanguagePreferences from "./features/LanguagePreference/components/EditLanguagePreferences.jsx";
import EnterNewEmail from "./components/Manage/EnterNewEmail.jsx";
import FirstVerifyItsYou from "./components/Manage/FirstVerifyItsYou.jsx";
import ManageDashboard from "./components/Manage/ManageDashboard.jsx";
import ProfileHome from "./components/Manage/ProfileHome.jsx";

import ProfileUpdateNameConfirmUpdate from "./features/ProfileName/components/ConfirmUpdate.jsx";
import ProfileUpdateNameSuccess from "./features/ProfileName/components/SuccessfullyUpdated.jsx";
import SuccessfullyUpdatedLanguage from "./features/LanguagePreference/components/SuccessfullyUpdated.jsx";
import Manage2FAVerifications from "./components/Manage/SecuritySettings/Manage2FAVerifications.jsx";
import SecuritySettings from "./components/Manage/SecuritySettings/SecuritySettings.jsx";
import YouMayUpdateEmailAtOtherPlaces from "./components/Manage/YouMayUpdateEmailAtOtherPlaces.jsx";
import ProfileUpdateName from "./features/ProfileName/components/ProfileUpdateName.jsx";
import Verification from "./components/Verification/Verification.jsx";
import ChangePasswordIndex from "./features/ChangePassword/components/ChangePasswordIndex.jsx";
import UpdateContactPhoneNumberContainer from "./features/ContactPhoneNumber/components/UpdateContactPhoneNumberContainer.jsx";
import AddMFAPage from "./features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPage.jsx";
import DeleteMFAPage from "./features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPage.jsx";
import SkipLink from "./features/DoubleSignIn/components/SkipLink.jsx";
import LinkPrompt from "./features/DoubleSignIn/components/LinkPrompt.jsx";
import LinkSuccess from "./features/DoubleSignIn/components/LinkSuccess.jsx";
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
                    element: <SuccessfullyUpdatedLanguage />,
                    handle: { id: PAGES.successfullyUpdatedLanguage },
                  },
                  {
                    path: "update-language/confirm-update",
                    element: <ConfirmLanguageUpdate />,
                    handle: { id: PAGES.confirmLanguageUpdate },
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
                    handle: {
                      id: PAGES.manage2FAVerifications,
                      breadcrumbId: "1",
                    },
                    children: [
                      {
                        index: true,
                        element: <Manage2FAVerifications />,
                      },
                      {
                        path: "add-mfa-phone-number",
                        element: <AddMFAPage />,
                        handle: { id: PAGES.addMFAPage },
                      },
                      {
                        path: "delete-mfa-phone-number",
                        element: <DeleteMFAPage />,
                        handle: { id: PAGES.deleteMFAPage },
                      },
                    ],
                  },
                ],
              },
              {
                path: "LinkPrompt",
                handle: { id: PAGES.LinkPrompt },
                children: [
                  {
                    index: true,
                    element: <LinkPrompt />,
                  },
                  {
                    path: "SkipLink",
                    element: <SkipLink />,
                    handle: { id: PAGES.SkipLink },
                  },
                  {
                    path: "LinkSuccess",
                    element: <LinkSuccess />,
                    handle: { id: PAGES.LinkSuccess },
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
