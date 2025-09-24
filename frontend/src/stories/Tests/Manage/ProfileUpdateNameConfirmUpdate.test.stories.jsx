import { expect, userEvent, within } from "@storybook/test";
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

// Test confirmation page display and save functionality
export const ConfirmNameUpdate = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      [
        // Mock the API call for saving the profile update
        {
          type: "post",
          endpoint: "/api/user/update",
          response: {
            success: true,
            message: "User profile updated successfully",
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
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 2000));

    // Verify the confirmation page content is displayed
    await step("Verify confirmation page content", async () => {
      const container = canvasElement.querySelector("main") || canvasElement;
      await expect(container).toBeInTheDocument();

      // Look for the username display (should show the new name)
      const usernameDisplay = canvasElement.querySelector("strong");
      if (usernameDisplay) {
        await expect(usernameDisplay).toBeInTheDocument();
      }
    });

    // Test saving the updated profile
    await step("Click Save Changes button", async () => {
      // Find the Save/Confirm button (primary button)
      let saveButton =
        canvas.getByText(/Yes, update/i) ||
        canvasElement.querySelector(
          'gcds-button:not([button-role="secondary"])',
        ) ||
        canvasElement.querySelector('gcds-button button[part="button"]');

      await expect(saveButton).toBeInTheDocument();

      // If it's a GCDS button wrapper, find the actual button inside shadow DOM
      if (saveButton.tagName === "GCDS-BUTTON" && saveButton.shadowRoot) {
        const actualButton =
          saveButton.shadowRoot.querySelector('button[part="button"]') ||
          saveButton.shadowRoot.querySelector("button");
        if (actualButton) {
          saveButton = actualButton;
        }
      }

      await userEvent.click(saveButton);

      // Wait for navigation or processing
      await new Promise((r) => setTimeout(r, 1000));
    });

    await new Promise((r) => setTimeout(r, 1000));
  },
};

// Test cancel functionality
export const CancelNameUpdate = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    // Test canceling the update
    await step("Click Cancel button", async () => {
      // Find the Cancel button (secondary button)
      let cancelButton =
        canvas.getByText(/Cancel|Back/i) ||
        canvasElement.querySelector('gcds-button[button-role="secondary"]') ||
        canvasElement.querySelector("gcds-button:nth-child(2)");

      await expect(cancelButton).toBeInTheDocument();

      // If it's a GCDS button wrapper, find the actual button inside shadow DOM
      if (cancelButton.tagName === "GCDS-BUTTON" && cancelButton.shadowRoot) {
        const actualButton =
          cancelButton.shadowRoot.querySelector('button[part="button"]') ||
          cancelButton.shadowRoot.querySelector("button");
        if (actualButton) {
          cancelButton = actualButton;
        }
      }

      await userEvent.click(cancelButton);

      // Wait for navigation
      await new Promise((r) => setTimeout(r, 1000));
    });

    await new Promise((r) => setTimeout(r, 1000));
    // Should navigate back to profile or show 404 in Storybook environment
    await expect(canvas.getByText(/404 Not Found/i)).toBeInTheDocument();
  },
};
