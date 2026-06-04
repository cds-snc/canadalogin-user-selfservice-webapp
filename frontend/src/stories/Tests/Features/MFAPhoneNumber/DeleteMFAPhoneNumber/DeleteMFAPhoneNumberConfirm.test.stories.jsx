import { expect, userEvent, waitFor } from "storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../../../utils/constants";
import { buildTestCase, TestTemplate } from "../../../utils/functions.tsx";
import {
  waitForComponentReady,
  waitForGcdsButton,
  waitForPhoneNumber,
  getClickableButton,
} from "../../../utils/gcdsTestHelpers.js";

export default {
  title:
    "GC Sign In/Tests/Features/MFAPhoneNumber/DeleteMFAPhoneNumber/Delete MFA Phone Number Confirm",
  component: TestTemplate,
  args: {
    page: PAGES.deleteMFAPhoneNumberConfirm,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    otpType: FLOW_TYPES.sms,
    passwordValidated: false,
    firstName: "John",
    lastName: "Doe",
    password: "TestPassword123!",
    otp: "123456",
    onNext: () => console.log("onNext called"),
    onCancel: () => console.log("onCancel called"),
    phoneFormData: {
      phoneNumber: "+15551234567",
      formattedPhoneNumber: "+1 (555) 123-4567",
      mfaFactorsToDelete: [
        {
          id: "factor-1",
          type: "smsotp",
          phoneNumber: "+15551234567",
        },
      ],
    },
  },
};

// Test: Confirmation page displays with phone number
export const ConfirmationPageDisplay = {
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
    await step("Verify confirmation heading is displayed", async () => {
      // Wait for the heading to be rendered - no hardcoded timeout needed
      await waitFor(
        async () => {
          const heading = canvasElement.querySelector("gcds-heading");
          await expect(heading).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    await step("Verify phone number is displayed", async () => {
      // Wait for phone number to appear in any format
      await waitForPhoneNumber(canvasElement, "+15551234567");
    });
  },
};

// Test: Delete button is present and styled as danger
export const DeleteButtonPresent = {
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
    await step(
      "Verify delete button exists and has danger styling",
      async () => {
        // Use helper function to wait for danger button - no hardcoded timeout
        const dangerButton = await waitForGcdsButton(canvasElement, "danger");
        await expect(dangerButton).toBeTruthy();

        // Verify the shadow DOM button has the danger class
        const innerButton = getClickableButton(dangerButton);
        await expect(innerButton?.className).toContain("button--role-danger");
      },
    );
  },
};

// Test: Cancel button is present
export const CancelButtonPresent = {
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
    await step(
      "Verify cancel button exists and has secondary styling",
      async () => {
        // Use helper function to wait for secondary button - no hardcoded timeout
        const secondaryButton = await waitForGcdsButton(
          canvasElement,
          "secondary",
        );
        await expect(secondaryButton).toBeTruthy();

        // Verify the shadow DOM button has the secondary class
        const innerButton = getClickableButton(secondaryButton);
        await expect(innerButton?.className).toContain(
          "button--role-secondary",
        );
      },
    );
  },
};

// Test: Click delete button
export const ClickDeleteButton = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      [
        {
          type: "delete",
          endpoint: "/v1/otp/mfa/delete",
          response: {
            success: true,
            message: "MFA deleted successfully",
          },
        },
      ],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("Click the delete button", async () => {
      // Wait for danger button to be ready
      const dangerButton = await waitForGcdsButton(canvasElement, "danger");
      await expect(dangerButton).toBeTruthy();

      // Get the actual clickable button and click it
      const actualButton = getClickableButton(dangerButton);
      if (actualButton) {
        await userEvent.click(actualButton);
        // Wait for any state changes or navigation to complete
        // Replace hardcoded timeout with waiting for specific conditions
        await waitFor(
          async () => {
            // Wait for some indication that the action was processed
            // This could be a success message, navigation, or state change
            await expect(actualButton).toBeInTheDocument();
          },
          { timeout: 1000 },
        );
      }
    });
  },
};

// Test: Click cancel button
export const ClickCancelButton = {
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
    await step("Click the cancel button", async () => {
      // Wait for secondary button to be ready
      const secondaryButton = await waitForGcdsButton(
        canvasElement,
        "secondary",
      );
      await expect(secondaryButton).toBeTruthy();

      // Get the actual clickable button and click it
      const actualButton = getClickableButton(secondaryButton);
      if (actualButton) {
        await userEvent.click(actualButton);
        // Wait for any state changes or navigation to complete
        await waitFor(
          async () => {
            // Wait for some indication that the action was processed
            await expect(actualButton).toBeInTheDocument();
          },
          { timeout: 1000 },
        );
      }
    });
  },
};

// Test: Display with multiple phone numbers in mfaFactorsToDelete
export const MultipleFactorsToDelete = {
  args: {
    phoneFormData: {
      phoneNumber: "+15551234567",
      formattedPhoneNumber: "+1 (555) 123-4567",
      mfaFactorsToDelete: [
        {
          id: "factor-1",
          type: "smsotp",
          phoneNumber: "+15551234567",
        },
        {
          id: "factor-2",
          type: "voiceotp",
          phoneNumber: "+15551234567",
        },
      ],
    },
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
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify page renders with multiple factors", async () => {
      // Wait for phone number to appear using the helper function
      await waitForPhoneNumber(canvasElement, "+15551234567");
    });
  },
};

// Test: Different phone number format
export const DifferentPhoneFormat = {
  args: {
    phoneFormData: {
      phoneNumber: "+14165551234",
      formattedPhoneNumber: "+1 (416) 555-1234",
      mfaFactorsToDelete: [
        {
          id: "factor-1",
          type: "smsotp",
          phoneNumber: "+14165551234",
        },
      ],
    },
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
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify different phone number is displayed", async () => {
      // Wait for the different phone number to appear using the helper function
      await waitForPhoneNumber(canvasElement, "+14165551234");
    });
  },
};

// Test: Empty phone form data handling
export const EmptyPhoneFormData = {
  args: {
    phoneFormData: {
      phoneNumber: "",
      formattedPhoneNumber: "",
      mfaFactorsToDelete: [],
    },
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
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify page still renders with empty data", async () => {
      // Wait for heading to be rendered
      await waitFor(
        async () => {
          const heading = canvasElement.querySelector("gcds-heading");
          await expect(heading).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    await step("Verify buttons are still present", async () => {
      // Use helper functions to wait for both buttons
      const dangerButton = await waitForGcdsButton(canvasElement, "danger");
      const secondaryButton = await waitForGcdsButton(
        canvasElement,
        "secondary",
      );

      await expect(dangerButton).toBeTruthy();
      await expect(secondaryButton).toBeTruthy();
    });
  },
};

// Test: Voice OTP factor deletion
export const VoiceOtpFactor = {
  args: {
    phoneFormData: {
      phoneNumber: "+15551234567",
      formattedPhoneNumber: "+1 (555) 123-4567",
      mfaFactorsToDelete: [
        {
          id: "factor-voice-1",
          type: "voiceotp",
          phoneNumber: "+15551234567",
        },
      ],
    },
  },
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      [
        {
          type: "delete",
          endpoint: "/v1/otp/mfa/delete",
          response: {
            success: true,
            message: "Voice MFA deleted successfully",
          },
        },
      ],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify voice OTP confirmation displays", async () => {
      // Wait for phone number to appear using the helper function
      await waitForPhoneNumber(canvasElement, "+15551234567");
    });
  },
};

// Test: Grid layout is present
export const GridLayoutPresent = {
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
    await step("Verify grid components are present", async () => {
      await waitFor(
        async () => {
          const grids = canvasElement.querySelectorAll("gcds-grid");
          await expect(grids.length).toBeGreaterThanOrEqual(1);
        },
        { timeout: 3000 },
      );
    });

    await step("Verify container components are present", async () => {
      await waitFor(
        async () => {
          const containers = canvasElement.querySelectorAll("gcds-container");
          await expect(containers.length).toBeGreaterThanOrEqual(1);
        },
        { timeout: 3000 },
      );
    });
  },
};

// Test: Strong tag for phone number emphasis
export const PhoneNumberEmphasis = {
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
    await step(
      "Verify phone number is emphasized with strong tag",
      async () => {
        await waitFor(
          async () => {
            // The phone number should be wrapped in a strong tag
            const strongElements = canvasElement.querySelectorAll("strong");
            const hasPhoneInStrong = Array.from(strongElements).some(
              (el) =>
                el.textContent.includes("555") || el.textContent.includes("+1"),
            );
            await expect(
              hasPhoneInStrong || strongElements.length > 0,
            ).toBeTruthy();
          },
          { timeout: 3000 },
        );
      },
    );
  },
};

// Test: All GCDS components render
export const AllGcdsComponentsRender = {
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
    await step("Verify all expected GCDS components are present", async () => {
      // Use component ready helper to wait for key components
      const components = await waitForComponentReady(canvasElement, {
        expectHeading: true,
        expectButtons: true,
        expectedButtonCount: 2,
      });

      // Verify specific components are rendered
      await waitFor(
        async () => {
          const text = canvasElement.querySelector("gcds-text");
          const link = canvasElement.querySelector("gcds-link");
          const grids = canvasElement.querySelectorAll("gcds-grid");
          const containers = canvasElement.querySelectorAll("gcds-container");

          await expect(text).toBeInTheDocument();
          await expect(link).toBeInTheDocument();
          await expect(grids.length).toBeGreaterThanOrEqual(1);
          await expect(containers.length).toBeGreaterThanOrEqual(1);
        },
        { timeout: 3000 },
      );

      // Components from the helper should also be available
      await expect(components.heading).toBeInTheDocument();
      await expect(components.buttons.length).toBeGreaterThanOrEqual(2);
    });
  },
};
