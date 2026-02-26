import { Navigate } from "react-router";

import RootLayout from "./components/Layout/RootLayout";
import { AppLanguageSetup } from "./components/Providers/AppLanguageSetup";
import { LanguageProvider } from "./components/Providers/LanguageProvider";
import {
  PrivateRoute,
  StepupPrivateRoute,
} from "./components/Providers/PrivateRoute";
import { UserProvider } from "./components/Providers/UserProvider";

import EditLanguagePreferencePage from "./features/LanguagePreference/components/EditLanguagePreferencePage";
import ManageDashboard from "./components/Manage/ManageDashboard";
import ProfileHome from "./components/Manage/ProfileHome";
import Manage2FAVerifications from "./components/Manage/SecuritySettings/Manage2FAVerifications";
import SecuritySettings from "./components/Manage/SecuritySettings/SecuritySettings";
import EditProfileNamePage from "./features/ProfileName/components/EditProfileNamePage";
import Verification from "./components/Verification/Verification";
import ChangePasswordIndex from "./features/ChangePassword/components/ChangePasswordIndex";
import EditContactPhoneNumberPage from "./features/ContactPhoneNumber/components/EditContactPhoneNumberPage";
import AddMFAPage from "./features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPage";
import DeleteMFAPage from "./features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPage";
import { PAGES } from "./utils/constants";
import EditEmailAddressPage from "./features/EmailAddress/EditEmailAddressPage";
import AddFIDO2PasskeyPage from "./features/ManageFIDO2/components/AddFIDO2Passkey/AddFIDO2PasskeyPage";
import DeleteFIDO2PasskeyPage from "./features/ManageFIDO2/components/DeleteFIDO2Passkey/DeleteFIDO2PasskeyPage";
import { RenameFIDO2PasskeyPage } from "./features/ManageFIDO2/components/RenameFIDO2Passkey/RenameFIDO2PasskeyPage";

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
                path: "profile",
                handle: { id: PAGES.ProfileHome, breadcrumbId: "1" },
                children: [
                  {
                    index: true,
                    element: <ProfileHome />,
                  },
                  {
                    path: "update-name/:step?",
                    element: <EditProfileNamePage />,
                    handle: { id: PAGES.editProfileNamePage },
                  },
                  {
                    path: "update-language/:step?",
                    element: <EditLanguagePreferencePage />,
                    handle: { id: PAGES.editLanguagePreferences },
                  },
                  {
                    path: "update-contact-phone/:step?",
                    element: <EditContactPhoneNumberPage />,
                    handle: { id: PAGES.editContactPhoneNumberPage },
                  },
                  {
                    path: "update-email/:step?",
                    element: <EditEmailAddressPage />,
                    handle: { id: PAGES.editEmailPage },
                  },
                ],
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
                    path: "update-password",
                    element: <ChangePasswordIndex />,
                    handle: { id: PAGES.password },
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
                      {
                        path: "add-fido2",
                        element: <AddFIDO2PasskeyPage />,
                        handle: { id: PAGES.addFIDO2PasskeyPage },
                      },
                      {
                        path: "delete-fido2/:passkeyId?",
                        element: <DeleteFIDO2PasskeyPage />,
                        handle: { id: PAGES.deleteFIDO2PasskeyPage },
                      },
                      {
                        path: "rename-fido2",
                        element: <RenameFIDO2PasskeyPage />,
                        handle: { id: PAGES.renameFIDO2PasskeyPage },
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
