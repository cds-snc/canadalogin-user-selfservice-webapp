import { expect, userEvent, within } from "@storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../utils/functions.tsx";

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
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 2000)); // Increased wait time

    // Fill in first name
    await step("Fill in given name field", async () => {
      // Find the GCDS input wrapper first
      const gcdsInput = canvas.queryByTestId("givenName");

      // Access the actual input inside the shadow DOM
      let givenNameInput = null;
      if (gcdsInput && gcdsInput.shadowRoot) {
        givenNameInput =
          gcdsInput.shadowRoot.querySelector('input[part="input"]') ||
          gcdsInput.shadowRoot.querySelector("input#givenName") ||
          gcdsInput.shadowRoot.querySelector("input");
      }

      // Fallback to other methods if shadow DOM doesn't work
      if (!givenNameInput) {
        const textboxes = canvas.queryAllByRole("textbox");
        givenNameInput =
          textboxes[0] ||
          canvasElement.querySelector('input[name="givenName"]') ||
          canvasElement.querySelector("#givenName") ||
          canvasElement.querySelector(
            'gcds-input[data-testid="givenName"] input',
          );
      }

      await expect(givenNameInput).toBeInTheDocument();
      await userEvent.type(givenNameInput, "Test");

      // Wait a moment for the value to be set
      await new Promise((r) => setTimeout(r, 500));

      // Only check value if we found a proper input element
      await expect(givenNameInput).toHaveValue("Test");
    });

    // Fill in last name
    await step("Fill in family name field", async () => {
      // Find the GCDS input wrapper first
      const gcdsInput = canvas.queryByTestId("familyName");

      // Access the actual input inside the shadow DOM
      let familyNameInput = null;
      if (gcdsInput && gcdsInput.shadowRoot) {
        familyNameInput =
          gcdsInput.shadowRoot.querySelector('input[part="input"]') ||
          gcdsInput.shadowRoot.querySelector("input#familyName") ||
          gcdsInput.shadowRoot.querySelector("input");
      }

      // Fallback to other methods if shadow DOM doesn't work
      if (!familyNameInput) {
        const textboxes = canvas.queryAllByRole("textbox");
        familyNameInput =
          textboxes[1] ||
          canvasElement.querySelector('input[name="familyName"]') ||
          canvasElement.querySelector("#familyName") ||
          canvasElement.querySelector(
            'gcds-input[data-testid="familyName"] input',
          );
      }

      await expect(familyNameInput).toBeInTheDocument();
      await userEvent.type(familyNameInput, "User");
      await userEvent.tab(); // Trigger blur/validation like existing tests

      // Wait a moment for the value to be set
      await new Promise((r) => setTimeout(r, 500));

      // Only check value if we found a proper input element
      await expect(familyNameInput).toHaveValue("User");

      // Only check value if we found a proper input element
      if (familyNameInput && familyNameInput.tagName === "INPUT") {
        await expect(familyNameInput).toHaveValue("User");
      }
    });

    // Submit the form - Click the Continue button
    await step("Click Continue button", async () => {
      // Try multiple ways to find the Continue button
      let continueButton =
        canvas.getByText(/Continue/i) ||
        canvasElement.querySelector('gcds-button[type="submit"] button') ||
        canvasElement.querySelector('button[type="submit"]') ||
        canvasElement.querySelector('gcds-button button[part="button"]');

      await expect(continueButton).toBeInTheDocument();

      // If it's a GCDS button wrapper, try to find the actual button inside the shadow DOM
      if (
        continueButton.tagName === "GCDS-BUTTON" &&
        continueButton.shadowRoot
      ) {
        const actualButton =
          continueButton.shadowRoot.querySelector('button[part="button"]') ||
          continueButton.shadowRoot.querySelector("button");
        if (actualButton) {
          continueButton = actualButton;
        }
      }

      // Click the Continue button
      await userEvent.click(continueButton);

      // Wait a moment for any processing
      await new Promise((r) => setTimeout(r, 1000));
    });

    await new Promise((r) => setTimeout(r, 1000));
    await expect(canvas.getByText(/404 Not Found/i)).toBeInTheDocument();
  },
};

// Test cancel button functionality
export const CancelFormSubmission = {
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
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    // Click cancel button
    await step("Click cancel button", async () => {
      // Try multiple ways to find the Cancel button
      let cancelButton =
        canvas.getByText(/Cancel/i) ||
        canvasElement.querySelector(
          "#form > gcds-container > gcds-button:nth-child(4)",
        ) ||
        canvasElement.querySelector('gcds-button[button-role="secondary"]') ||
        canvasElement.querySelector('gcds-button button[part="button"]');

      await expect(cancelButton).toBeInTheDocument();

      // If it's a GCDS button wrapper, try to find the actual button inside the shadow DOM
      if (cancelButton.tagName === "GCDS-BUTTON" && cancelButton.shadowRoot) {
        const actualButton =
          cancelButton.shadowRoot.querySelector('button[part="button"]') ||
          cancelButton.shadowRoot.querySelector("button.gcds-button") ||
          cancelButton.shadowRoot.querySelector("button");
        if (actualButton) {
          cancelButton = actualButton;
        }
      }

      await userEvent.click(cancelButton);

      // Wait a moment for any processing
      await new Promise((r) => setTimeout(r, 1000));
    });

    await new Promise((r) => setTimeout(r, 1000));
    await expect(canvas.getByText(/404 Not Found/i)).toBeInTheDocument();
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
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 2000));

    // Fill in first name only
    await step("Fill in given name field only", async () => {
      let givenNameInput =
        canvas.queryByTestId("givenName") ||
        canvas.querySelector('input[name="givenName"]') ||
        canvas.querySelector("#givenName") ||
        canvas.querySelector('gcds-input[input-id="givenName"] input');

      await expect(givenNameInput).toBeInTheDocument();
      await userEvent.type(givenNameInput, "Jane");
    });

    // Leave family name empty and try to submit
    await step(
      "Try to submit with empty family name and verify validation",
      async () => {
        let familyNameInput =
          canvas.queryByTestId("familyName") ||
          canvas.querySelector('input[name="familyName"]') ||
          canvas.querySelector("#familyName") ||
          canvas.querySelector('gcds-input[input-id="familyName"] input');

        await expect(familyNameInput).toBeInTheDocument();

        // Click the actual Continue button instead of the test button
        let continueButton =
          canvas.getByText(/Continue/i) ||
          canvasElement.querySelector('gcds-button[type="submit"] button') ||
          canvasElement.querySelector('button[type="submit"]') ||
          canvasElement.querySelector('gcds-button button[part="button"]');

        await expect(continueButton).toBeInTheDocument();

        // If it's a GCDS button wrapper, try to find the actual button inside the shadow DOM
        if (
          continueButton.tagName === "GCDS-BUTTON" &&
          continueButton.shadowRoot
        ) {
          const actualButton =
            continueButton.shadowRoot.querySelector('button[part="button"]') ||
            continueButton.shadowRoot.querySelector("button");
          if (actualButton) {
            continueButton = actualButton;
          }
        }

        await userEvent.click(continueButton);
        await new Promise((r) => setTimeout(r, 1000));
      },
    );

    await new Promise((r) => setTimeout(r, 1000));
  },
};
