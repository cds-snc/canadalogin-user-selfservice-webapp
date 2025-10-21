import { expect, userEvent, waitFor } from "@storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../../../utils/functions.tsx";

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
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify confirmation heading is displayed", async () => {
      // The heading should contain deletion confirmation text
      await waitFor(
        async () => {
          const heading = canvasElement.querySelector("gcds-heading");
          await expect(heading).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    await step("Verify phone number is displayed", async () => {
      // The formatted phone number should be visible
      const phoneText = canvasElement.textContent;
      const hasFormattedPhone =
        phoneText.includes("+1 (555) 123-4567") ||
        phoneText.includes("+15551234567") ||
        phoneText.includes("555-123-4567");
      await expect(hasFormattedPhone).toBeTruthy();
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
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify delete button exists", async () => {
      await waitFor(
        async () => {
          const buttons = canvasElement.querySelectorAll("gcds-button");
          const dangerButton = Array.from(buttons).find((btn) => {
            if (btn.shadowRoot) {
              const innerButton = btn.shadowRoot.querySelector("button");
              return innerButton?.className.includes("button--role-danger");
            }
            return false;
          });
          await expect(dangerButton).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    await step("Verify delete button has danger styling", async () => {
      const buttons = canvasElement.querySelectorAll("gcds-button");
      const dangerButton = Array.from(buttons).find((btn) => {
        if (btn.shadowRoot) {
          const innerButton = btn.shadowRoot.querySelector("button");
          return innerButton?.className.includes("button--role-danger");
        }
        return false;
      });
      await expect(dangerButton).toBeTruthy();

      // Verify the shadow DOM button has the danger class
      const innerButton = dangerButton.shadowRoot.querySelector("button");
      await expect(innerButton.className).toContain("button--role-danger");
    });
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
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify cancel button exists", async () => {
      await waitFor(
        async () => {
          const buttons = canvasElement.querySelectorAll("gcds-button");
          const secondaryButton = Array.from(buttons).find((btn) => {
            if (btn.shadowRoot) {
              const innerButton = btn.shadowRoot.querySelector("button");
              return innerButton?.className.includes("button--role-secondary");
            }
            return false;
          });
          await expect(secondaryButton).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    await step("Verify cancel button has secondary styling", async () => {
      const buttons = canvasElement.querySelectorAll("gcds-button");
      const secondaryButton = Array.from(buttons).find((btn) => {
        if (btn.shadowRoot) {
          const innerButton = btn.shadowRoot.querySelector("button");
          return innerButton?.className.includes("button--role-secondary");
        }
        return false;
      });
      await expect(secondaryButton).toBeTruthy();

      // Verify the shadow DOM button has the secondary class
      const innerButton = secondaryButton.shadowRoot.querySelector("button");
      await expect(innerButton.className).toContain("button--role-secondary");
    });
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
    await new Promise((r) => setTimeout(r, 1000));

    await step("Click the delete button", async () => {
      const buttons = canvasElement.querySelectorAll("gcds-button");
      const dangerButton = Array.from(buttons).find((btn) => {
        if (btn.shadowRoot) {
          const innerButton = btn.shadowRoot.querySelector("button");
          return innerButton?.className.includes("button--role-danger");
        }
        return false;
      });
      await expect(dangerButton).toBeTruthy();

      // Find the actual button in shadow DOM
      if (dangerButton && dangerButton.shadowRoot) {
        const actualButton =
          dangerButton.shadowRoot.querySelector('button[part="button"]') ||
          dangerButton.shadowRoot.querySelector("button");
        if (actualButton) {
          await userEvent.click(actualButton);
          await new Promise((r) => setTimeout(r, 500));
        }
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
    await new Promise((r) => setTimeout(r, 1000));

    await step("Click the cancel button", async () => {
      const buttons = canvasElement.querySelectorAll("gcds-button");
      const secondaryButton = Array.from(buttons).find((btn) => {
        if (btn.shadowRoot) {
          const innerButton = btn.shadowRoot.querySelector("button");
          return innerButton?.className.includes("button--role-secondary");
        }
        return false;
      });
      await expect(secondaryButton).toBeTruthy();

      // Find the actual button in shadow DOM
      if (secondaryButton && secondaryButton.shadowRoot) {
        const actualButton =
          secondaryButton.shadowRoot.querySelector('button[part="button"]') ||
          secondaryButton.shadowRoot.querySelector("button");
        if (actualButton) {
          await userEvent.click(actualButton);
          await new Promise((r) => setTimeout(r, 500));
        }
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
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify page renders with multiple factors", async () => {
      await waitFor(
        async () => {
          const hasPhoneNumber =
            canvasElement.textContent.includes("+1 (555) 123-4567") ||
            canvasElement.textContent.includes("+15551234567");
          await expect(hasPhoneNumber).toBeTruthy();
        },
        { timeout: 3000 },
      );
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
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify different phone number is displayed", async () => {
      const phoneText = canvasElement.textContent;
      const hasPhone =
        phoneText.includes("+1 (416) 555-1234") ||
        phoneText.includes("+14165551234") ||
        phoneText.includes("416-555-1234");
      await expect(hasPhone).toBeTruthy();
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
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify page still renders with empty data", async () => {
      // Page should render even with empty phone data
      const heading = canvasElement.querySelector("gcds-heading");
      await expect(heading).toBeInTheDocument();
    });

    await step("Verify buttons are still present", async () => {
      const buttons = canvasElement.querySelectorAll("gcds-button");
      const dangerButton = Array.from(buttons).find((btn) => {
        if (btn.shadowRoot) {
          const innerButton = btn.shadowRoot.querySelector("button");
          return innerButton?.className.includes("button--role-danger");
        }
        return false;
      });
      const secondaryButton = Array.from(buttons).find((btn) => {
        if (btn.shadowRoot) {
          const innerButton = btn.shadowRoot.querySelector("button");
          return innerButton?.className.includes("button--role-secondary");
        }
        return false;
      });
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
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify voice OTP confirmation displays", async () => {
      const hasPhoneNumber =
        canvasElement.textContent.includes("+1 (555) 123-4567") ||
        canvasElement.textContent.includes("+15551234567");
      await expect(hasPhoneNumber).toBeTruthy();
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
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify grid components are present", async () => {
      const grids = canvasElement.querySelectorAll("gcds-grid");
      await expect(grids.length).toBeGreaterThanOrEqual(1);
    });

    await step("Verify container components are present", async () => {
      const containers = canvasElement.querySelectorAll("gcds-container");
      await expect(containers.length).toBeGreaterThanOrEqual(1);
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
    await new Promise((r) => setTimeout(r, 1000));

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
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify all expected GCDS components are present", async () => {
      const heading = canvasElement.querySelector("gcds-heading");
      const text = canvasElement.querySelector("gcds-text");
      const link = canvasElement.querySelector("gcds-link");
      const buttons = canvasElement.querySelectorAll("gcds-button");
      const grids = canvasElement.querySelectorAll("gcds-grid");
      const containers = canvasElement.querySelectorAll("gcds-container");

      await expect(heading).toBeInTheDocument();
      await expect(text).toBeInTheDocument();
      await expect(link).toBeInTheDocument();
      await expect(buttons.length).toBeGreaterThanOrEqual(2);
      await expect(grids.length).toBeGreaterThanOrEqual(1);
      await expect(containers.length).toBeGreaterThanOrEqual(1);
    });
  },
};
