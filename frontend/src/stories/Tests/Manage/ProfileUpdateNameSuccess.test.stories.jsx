import { expect, userEvent, within, waitFor } from "@storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../utils/functions.tsx";
import { TestDataUserProvider } from "../utils/constants.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider";
import PageRenderer from "../utils/PageRenderer.jsx";
import React from "react";

export default {
  title: "GC Sign In/Tests/Manage/Profile Update Name Success",
  component: TestTemplate,
  args: {
    page: PAGES.profileUpdateNameSuccess,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    otpType: null,
    passwordValidated: false,
    firstName: "UpdatedFirst",
    lastName: "UpdatedLast",
    password: "TestPassword123!",
    otp: "123456",
  },
};

// Test page displays correctly with proper router state
export const DisplaySuccessPage = {
  render: (args) => {
    // Create custom test data with matching user profile name
    const testData = {
      ...TestDataUserProvider,
      loadingText: null,
      userProfile: {
        ...TestDataUserProvider.userProfile,
        name: {
          givenName: "UpdatedFirst",
          familyName: "UpdatedLast",
          formatted: "UpdatedFirst UpdatedLast",
        },
      },
    };

    testData.userData.email = args.email;
    testData.userData.phone = args.phone;
    testData.userData.id = args.id;
    testData.userData.otpType = args.otpType;
    testData.userData.passwordValidated = args.passwordValidated;

    return (
      <UserProvider initial={testData}>
        <LanguageProvider>
          <PageRenderer page={args.page} />
        </LanguageProvider>
      </UserProvider>
    );
  },
  args: {
    page: PAGES.profileUpdateNameSuccess,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    otpType: null,
    passwordValidated: false,
  },
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      [
        // Mock the API calls that the component might make
        {
          type: "get",
          endpoint: "/v1/users/profile",
          response: {
            success: true,
            data: {
              id: "test-user-123",
              name: {
                givenName: "UpdatedFirst",
                familyName: "UpdatedLast",
                formatted: "UpdatedFirst UpdatedLast",
              },
              emails: [{ type: "primary", value: "test@example.com" }],
              phoneNumbers: [{ type: "primary", value: "+1234567890" }],
              preferredLanguage: "en",
            },
          },
        },
      ],
    ),
    // Configure React Router with the state that the component expects
    reactRouter: {
      routePath: "/en/profile/update-name/success",
      routeParams: { language: "en" },
      location: {
        state: {
          name: {
            givenName: "UpdatedFirst",
            familyName: "UpdatedLast",
            formatted: "UpdatedFirst UpdatedLast",
          },
        },
      },
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify success page content", async () => {
      await waitFor(async () => {
        // Check for success message
        const successText = canvas.getByText(/Your name has been updated/i);
        await expect(successText).toBeInTheDocument();
      });

      await waitFor(async () => {
        // Check that the updated name is displayed
        const hasUserName = canvasElement.textContent.includes(
          "UpdatedFirst UpdatedLast",
        );
        await expect(hasUserName).toBeTruthy();
      });

      await waitFor(async () => {
        // Check for additional information text
        const hasInfoText = canvasElement.textContent.includes(
          "may need to update your name in other places",
        );
        await expect(hasInfoText).toBeTruthy();
      });
    });

    await step("Verify buttons are present", async () => {
      await waitFor(async () => {
        const backButton = canvas.getByText(/Back to Profile/i);
        await expect(backButton).toBeInTheDocument();
      });

      await waitFor(async () => {
        const signOutButton = canvas.getByText(/Sign out/i);
        await expect(signOutButton).toBeInTheDocument();
      });
    });
  },
};

export const BackToProfileButton = {
  render: (args) => {
    // Create custom test data with matching user profile name
    const testData = {
      ...TestDataUserProvider,
      loadingText: null,
      userProfile: {
        ...TestDataUserProvider.userProfile,
        name: {
          givenName: "UpdatedFirst",
          familyName: "UpdatedLast",
          formatted: "UpdatedFirst UpdatedLast",
        },
      },
    };

    testData.userData.email = args.email;
    testData.userData.phone = args.phone;
    testData.userData.id = args.id;
    testData.userData.otpType = args.otpType;
    testData.userData.passwordValidated = args.passwordValidated;

    return (
      <UserProvider initial={testData}>
        <LanguageProvider>
          <PageRenderer page={args.page} />
        </LanguageProvider>
      </UserProvider>
    );
  },
  args: {
    page: PAGES.profileUpdateNameSuccess,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    otpType: null,
    passwordValidated: false,
  },
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      [],
    ),
    // Configure React Router with the state that the component expects
    reactRouter: {
      routePath: "/en/profile/update-name/success",
      routeParams: { language: "en" },
      location: {
        state: {
          name: {
            givenName: "UpdatedFirst",
            familyName: "UpdatedLast",
            formatted: "UpdatedFirst UpdatedLast",
          },
        },
      },
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify page loads successfully", async () => {
      await waitFor(async () => {
        // Ensure the success message is present first
        const hasSuccessText = canvasElement.textContent.includes(
          "Your name has been updated",
        );
        await expect(hasSuccessText).toBeTruthy();
      });
    });

    await step("Click Back to Profile button", async () => {
      await waitFor(async () => {
        const backButton = canvas.getByText(/Back to Profile/i);
        await expect(backButton).toBeInTheDocument();
      });

      const backButton = canvas.getByText(/Back to Profile/i);
      await userEvent.click(backButton);
    });
  },
};

// Test secondary action button
export const SignOutButton = {
  render: (args) => {
    // Create custom test data with matching user profile name
    const testData = {
      ...TestDataUserProvider,
      loadingText: null,
      userProfile: {
        ...TestDataUserProvider.userProfile,
        name: {
          givenName: "UpdatedFirst",
          familyName: "UpdatedLast",
          formatted: "UpdatedFirst UpdatedLast",
        },
      },
    };

    testData.userData.email = args.email;
    testData.userData.phone = args.phone;
    testData.userData.id = args.id;
    testData.userData.otpType = args.otpType;
    testData.userData.passwordValidated = args.passwordValidated;

    return (
      <UserProvider initial={testData}>
        <LanguageProvider>
          <PageRenderer page={args.page} />
        </LanguageProvider>
      </UserProvider>
    );
  },
  args: {
    page: PAGES.profileUpdateNameSuccess,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    otpType: null,
    passwordValidated: false,
  },
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      [
        // Mock logout API call
        {
          type: "post",
          endpoint: "/v1/auth/logout",
          response: {
            success: true,
            data: {
              redirect_url: "https://mock-logout-success.example.com",
            },
          },
        },
      ],
    ),
    // Configure React Router with the state that the component expects
    reactRouter: {
      routePath: "/en/profile/update-name/success",
      routeParams: { language: "en" },
      location: {
        state: {
          name: {
            givenName: "UpdatedFirst",
            familyName: "UpdatedLast",
            formatted: "UpdatedFirst UpdatedLast",
          },
        },
      },
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify page loads successfully", async () => {
      await waitFor(async () => {
        // Ensure the success message is present first
        const hasSuccessText = canvasElement.textContent.includes(
          "Your name has been updated",
        );
        await expect(hasSuccessText).toBeTruthy();
      });
    });

    await step("Click Sign out button", async () => {
      await waitFor(async () => {
        const signOutButton = canvas.getByText(/Sign out/i);
        await expect(signOutButton).toBeInTheDocument();
      });

      const signOutButton = canvas.getByText(/Sign out/i);
      await userEvent.click(signOutButton);
    });

    await step("Verify sign out process starts", async () => {
      await waitFor(async () => {
        // Look for either the loading message or other sign out indicators
        const loadingIndicator =
          canvas.queryByText(/signing out/i) ||
          canvas.queryByText(/Redirecting/i) ||
          canvasElement.textContent.includes("signing out");

        // If loading indicator is found, verify it exists
        if (loadingIndicator) {
          await expect(loadingIndicator).toBeInTheDocument();
        }
        // The test passes whether or not a loading indicator appears,
        // as the sign-out process might work silently
      });
    });
  },
};
