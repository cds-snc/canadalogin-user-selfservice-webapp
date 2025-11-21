import { userEvent, waitFor, within, expect } from "@storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../utils/functions.tsx";

export default {
  title: "GC Sign In/Tests/Manage/Profile Update Name Confirm Update",
  component: TestTemplate,
  args: {
    page: PAGES.profileUpdateNameConfirmUpdate,
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

// Test form display with user data
export const DisplayConfirmationPage = {
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
          endpoint: "/api/user/profile",
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
      routePath: "/en/profile/update-name/confirm",
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
    // Configure Storybook to handle navigation gracefully
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
    // Add custom actions to track what happens
    actions: {
      handles: ["click", "submit", "navigate"],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify confirmation page content", async () => {
      await waitFor(async () => {
        // Check for the main heading using canvas.getByText pattern from AddMFAPage
        const headingText = canvas.getByText(
          /Are you sure you want to update your name?/i,
        );
        await expect(headingText).toBeInTheDocument();
      });

      await waitFor(async () => {
        // Check that the formatted name is displayed using textContent includes pattern
        const hasUserName = canvasElement.textContent.includes(
          "UpdatedFirst UpdatedLast",
        );
        await expect(hasUserName).toBeTruthy();
      });

      await waitFor(async () => {
        // Check for update request using broader pattern to avoid text splitting issues
        const hasUpdateText = canvasElement.textContent.includes(
          "requested to update your name",
        );
        await expect(hasUpdateText).toBeTruthy();
      });

      await waitFor(async () => {
        // Check for service message using broader pattern
        const hasServiceText =
          canvasElement.textContent.includes("following services");
        await expect(hasServiceText).toBeTruthy();
      });

      await waitFor(async () => {
        // Check for legal notice
        const legalText = canvas.getByText(/legally change your name/i);
        await expect(legalText).toBeInTheDocument();
      });
    });

    await step("Verify buttons are present", async () => {
      await waitFor(async () => {
        const updateButton = canvas.getByText(/Yes, update/i);
        await expect(updateButton).toBeInTheDocument();
      });

      await waitFor(async () => {
        const cancelButton = canvas.getByText(/Cancel/i);
        await expect(cancelButton).toBeInTheDocument();
      });
    });
  },
};

// Test button interactions
export const TestButtonInteractions = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      [
        {
          type: "get",
          endpoint: "/api/user/profile",
          response: {
            success: true,
            data: {
              id: "test-user-123",
              name: {
                givenName: "UpdatedFirst",
                familyName: "UpdatedLast",
              },
            },
          },
        },
        {
          type: "post",
          endpoint: "/api/user/update",
          response: {
            success: true,
            message: "User updated successfully",
          },
        },
      ],
    ),
    // Configure React Router with the state that the component expects
    reactRouter: {
      routePath: "/en/profile/update-name/confirm",
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

    await step("Verify page content is loaded", async () => {
      await waitFor(async () => {
        // Check that the confirmation heading is present
        const hasHeading = canvasElement.textContent.includes("Are you sure");
        await expect(hasHeading).toBeTruthy();
      });

      await waitFor(async () => {
        // Check that the user name is displayed
        const hasUserName = canvasElement.textContent.includes(
          "UpdatedFirst UpdatedLast",
        );
        await expect(hasUserName).toBeTruthy();
      });
    });

    await step("Verify and click Yes, update button", async () => {
      await waitFor(async () => {
        const updateButton = canvas.getByText(/Yes, update/i);
        await expect(updateButton).toBeInTheDocument();
      });

      const updateButton = canvas.getByText(/Yes, update/i);
      await userEvent.click(updateButton);
    });
  },
};

// Test cancel button functionality
export const TestCancelButton = {
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
      routePath: "/en/profile/update-name/confirm",
      routeParams: { language: "en" },
      location: {
        state: {
          name: {
            givenName: "TestFirst",
            familyName: "TestLast",
            formatted: "TestFirst TestLast",
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

    await step("Verify test name is displayed", async () => {
      await waitFor(async () => {
        // Check that the heading is present
        const hasHeading = canvasElement.textContent.includes("Are you sure");
        await expect(hasHeading).toBeTruthy();
      });

      await waitFor(async () => {
        // Check that the test name is displayed
        const hasTestName =
          canvasElement.textContent.includes("TestFirst TestLast");
        await expect(hasTestName).toBeTruthy();
      });
    });

    await step("Verify and click Cancel button", async () => {
      await waitFor(async () => {
        const cancelButton = canvas.getByText(/Cancel/i);
        await expect(cancelButton).toBeInTheDocument();
      });

      const cancelButton = canvas.getByText(/Cancel/i);
      await userEvent.click(cancelButton);
    });
  },
};
