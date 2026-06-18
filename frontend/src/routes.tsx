import { Navigate } from "react-router";
import type { RouteObject } from "react-router";

import RootLayout from "./components/Layout/RootLayout";
import { AppLanguageSetup } from "./components/Providers/AppLanguageSetup";
import { LanguageProvider } from "./components/Providers/LanguageProvider";
import { PrivateRoute } from "./components/Providers/PrivateRoute";
import { UserProvider } from "./components/Providers/UserProvider";

import EditLanguagePreferencePage from "./features/LanguagePreference/components/EditLanguagePreferencePage";
import ManageDashboard from "./components/Manage/ManageDashboard";
import ProfileHome from "./components/Manage/ProfileHome";
import Manage2FAVerifications from "./components/Manage/SecuritySettings/Manage2FAVerifications";
import SecuritySettings from "./components/Manage/SecuritySettings/SecuritySettings";
import EditProfileNamePage from "./features/ProfileName/components/EditProfileNamePage";
import ChangePasswordIndex from "./features/ChangePassword/components/ChangePasswordIndex";
import EditContactPhoneNumberPage from "./features/ContactPhoneNumber/components/EditContactPhoneNumberPage";
import AddMFAPage from "./features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPage";
import DeleteMFAPage from "./features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPage";
import { DEV_ONLY_FEATURE, PAGES } from "./utils/constants";
import EditEmailAddressPage from "./features/EmailAddress/EditEmailAddressPage";
import AddFIDO2PasskeyPage from "./features/ManageFIDO2/components/AddFIDO2Passkey/AddFIDO2PasskeyPage";
import DeleteFIDO2PasskeyPage from "./features/ManageFIDO2/components/DeleteFIDO2Passkey/DeleteFIDO2PasskeyPage";
import ServiceCanadaCentrePage from "./features/IDV/InPerson/ServiceCanadaCentrePage";
import ServiceCanadaCentreIDVCodePage from "./features/IDV/InPerson/ServiceCanadaCentreIDVCodePage";
import ProofingBarcodeCanadaPostPage from "./features/IDV/InPerson/ProofingBarcodeCanadaPostPage";
import StartIdentityProofingPage from "./features/IDV/StartIdentityProofingPage";
import ProvincialVerificationPage from "./features/IDV/Online/ProvincialVerificationPage";
import OnlineVerificationInfo from "./features/IDV/Online/OnlineVerificationInfo";
import ConfirmIdentityDetails from "./features/IDV/ConfirmIdentityDetails";

export const appRoutes: RouteObject[] = [
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
            handle: { id: PAGES.manageDashboard, breadcrumbId: "pageTitle" },
            children: [
              {
                index: true,
                element: <ManageDashboard />,
              },
              {
                path: "profile",
                handle: { id: PAGES.ProfileHome, breadcrumbId: "title" },
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
                  ...(DEV_ONLY_FEATURE
                    ? [
                        {
                          path: "update-email/:step?",
                          element: <EditEmailAddressPage />,
                          handle: { id: PAGES.editEmailPage },
                        },
                      ]
                    : []),
                ],
              },
              {
                path: "security-settings",
                handle: {
                  id: PAGES.securitySettings,
                  breadcrumbId: "pageTitle",
                },
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
                      breadcrumbId: "title",
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
                        element: <AddFIDO2PasskeyPage step={undefined} />,
                        handle: { id: PAGES.addFIDO2PasskeyPage },
                      },
                      {
                        path: "delete-fido2/:passkeyId?",
                        element: <DeleteFIDO2PasskeyPage step={undefined} />,
                        handle: { id: PAGES.deleteFIDO2PasskeyPage },
                      },
                    ],
                  },
                ],
              },
              ...(DEV_ONLY_FEATURE
                ? [
                    {
                      path: "idv/",
                      element: <StartIdentityProofingPage />,
                      handle: { id: PAGES.idvStartIdentityProofingPage },
                    },
                    {
                      path: "idv/in-person/service-canada-centre",
                      element: <ServiceCanadaCentrePage />,
                      handle: { id: PAGES.idvServiceCanadaCentrePage },
                    },
                    {
                      path: "idv/in-person/service-canada-centre/idv-code",
                      element: <ServiceCanadaCentreIDVCodePage />,
                      handle: { id: PAGES.idvServiceCanadaCentreCodePage },
                    },
                    {
                      path: "idv/in-person/canada-post/idv-code",
                      element: <ProofingBarcodeCanadaPostPage />,
                      handle: { id: PAGES.idvProofingBarcodeCanadaPostPage },
                    },
                    {
                      path: "idv/online",
                      element: <OnlineVerificationInfo />,
                      handle: { id: PAGES.idvOnlineVerificationInfoPage },
                    },
                    {
                      path: "idv/online/provincial",
                      element: <ProvincialVerificationPage />,
                      handle: { id: PAGES.idvProvincialVerificationPage },
                    },
                    {
                      path: "idv/details-confirmation",
                      element: <ConfirmIdentityDetails />,
                      handle: { id: PAGES.idvDetailsConfirmationPage },
                    },
                  ]
                : []),
            ],
          },
          { path: "*", element: <ManageDashboard /> },
        ],
      },
    ],
  },
];
