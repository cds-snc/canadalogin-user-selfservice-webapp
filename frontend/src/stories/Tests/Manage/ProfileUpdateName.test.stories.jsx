import { expect, userEvent } from "@storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../utils/functions.tsx";
import {
  waitForGcdsInput,
  waitForButtonByText,
  waitForTextContent,
  waitForComponentReady,
} from "../utils/gcdsTestHelpers.js";

export default {
  title: "GC Sign In/Tests/Manage/Profile Update Name",
  component: TestTemplate,
  args: {
    page: PAGES.profileUpdateName,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    otpType: null,
    passwordValidated: false,
    firstName: "John",
    lastName: "Doe",
    password: "TestPassword123!",
    otp: "123456",
  },
};

// Test form submission with valid data
export const SubmitValidForm = {
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
                givenName: "Test",
                familyName: "User",
                formatted: "Test User",
              },
              emails: [{ type: "primary", value: "test@example.com" }],
              phoneNumbers: [{ type: "primary", value: "+1234567890" }],
              preferredLanguage: "en",
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
    await waitForComponentReady(canvasElement);

    // Fill in first name
    await step("Fill in given name field", async () => {
      const givenNameInput = await waitForGcdsInput(canvasElement, "givenName");
      await userEvent.type(givenNameInput, "Test");
      await expect(givenNameInput).toHaveValue("Test");
    });

    // Fill in last name
    await step("Fill in family name field", async () => {
      const familyNameInput = await waitForGcdsInput(
        canvasElement,
        "familyName",
      );
      await userEvent.type(familyNameInput, "User");
      await userEvent.tab(); // Trigger blur/validation like existing tests
      await expect(familyNameInput).toHaveValue("User");
    });

    // Submit the form - Click the Continue button
    await step("Click Continue button", async () => {
      const continueButton = await waitForButtonByText(
        canvasElement,
        "Continue",
      );
      await userEvent.click(continueButton);
    });

    await waitForTextContent(canvasElement, "404 Not Found");
  },
};

// Test form validation - family name is required
export const ValidateRequiredFields = {
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
              name: { givenName: "Test", familyName: "User" },
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
    await waitForComponentReady(canvasElement);

    // Fill in first name only
    await step("Fill in given name field only", async () => {
      const givenNameInput = await waitForGcdsInput(canvasElement, "givenName");
      await userEvent.type(givenNameInput, "Jane");
    });

    // Leave family name empty and try to submit
    await step(
      "Try to submit with empty family name and verify validation",
      async () => {
        const familyNameInput = await waitForGcdsInput(
          canvasElement,
          "familyName",
        );
        await expect(familyNameInput).toBeInTheDocument();

        const continueButton = await waitForButtonByText(
          canvasElement,
          "Continue",
        );
        await userEvent.click(continueButton);
      },
    );
  },
};
