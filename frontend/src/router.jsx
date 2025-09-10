// src/router.js
import { createBrowserRouter } from "react-router";
import {
  PrivateRoute,
  StepupPrivateRoute,
} from "./components/Providers/PrivateRoute.jsx";
import Page from "./views/Page.js";
import { PAGES } from "./utils/constants.jsx";
import { UserProvider } from "./components/Providers/UserProvider";
import { LanguageProvider } from "./components/Providers/LanguageProvider";
import { AppLanguageSetup } from "./components/Providers/AppLanguageSetup";

const router = createBrowserRouter([
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
        path: "/",
        element: <Page page={PAGES.manageDashboard} />,
      },
      {
        path: ":language",
        children: [
          {
            index: true,
            element: <Page page={PAGES.manageDashboard} />,
          },
          {
            path: "profile-home",
            element: <Page page={PAGES.ProfileHome} />,
          },
          {
            path: "checkyouremail",
            element: <Page page={PAGES.CheckYourEmail} />,
          },
          {
            path: "completetwostepverification",
            element: <Page page={PAGES.CompleteTwoStepVerification} />,
          },
          {
            path: "firstverifyitsyou",
            element: <Page page={PAGES.FirstVerifyItsYou} />,
          },
          {
            path: "enternewemail",
            element: <Page page={PAGES.EnterNewEmail} />,
          },
          {
            path: "profile",
            children: [
              {
                path: "update-name",
                element: <Page page={PAGES.ProfileNameEdit} />,
              },
              {
                path: "update-name/success",
                element: <Page page={PAGES.profileYouMayUpdateName} />,
              },
              {
                path: "update-name/confirm-update",
                element: <Page page={PAGES.areYouSureEditYourName} />,
              },
              {
                path: "update-language",
                element: <Page page={PAGES.editLanguagePreferences} />,
              },
              {
                path: "update-language/success",
                element: <Page page={PAGES.profileYouMayUpdateLanguage} />,
              },
              {
                path: "update-language/confirm-update",
                element: <Page page={PAGES.areYouSureEditYourLanguage} />,
              },
            ],
          },
          {
            path: "areYouSureUpdateContactNumber",
            element: <Page page={PAGES.areYouSureUpdateContactNumber} />,
          },
          {
            path: "enterNewPhoneNumber",
            element: <Page page={PAGES.enterNewPhoneNumber} />,
          },
          {
            path: "youMayUpdateEmailAtOtherPlaces",
            element: <Page page={PAGES.youMayUpdateEmailAtOtherPlaces} />,
          },
          {
            path: "areYouSureUpdateYourEmail",
            element: <Page page={PAGES.areYouSureUpdateYourEmail} />,
          },
          {
            path: "security-settings",
            children: [
              {
                index: true,
                element: <Page page={PAGES.securitySettings} />,
              },
              {
                element: <StepupPrivateRoute />,
                children: [
                  {
                    path: "update-password",
                    element: <Page page={PAGES.updatePassword} />,
                  },
                ],
              },
            ],
          },
          {
            path: "verification",
            element: <Page page={PAGES.verification} />,
          },
        ],
      },

      // fallback
      {
        path: "*",
        element: <Page page={PAGES.manageDashboard} />,
      },
    ],
  },
]);

export default router;
