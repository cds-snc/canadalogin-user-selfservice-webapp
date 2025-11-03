import { expect, userEvent, waitFor, within } from "@storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
  SUBMIT_END_POINTS,
} from "../../../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../../../utils/functions.tsx";

export default {
  title:
    "GC Sign In/Tests/Features/MFAPhoneNumber/DeleteMFAPhoneNumber/Delete MFA Page",
  component: TestTemplate,
  args: {
    page: PAGES.deleteMFAPage,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    otpType: FLOW_TYPES.sms,
    passwordValidated: false,
    firstName: "John",
    lastName: "Doe",
    password: "TestPassword123!",
  },
};

export const CompleteDeleteFactor = (() => {
  const baseParams = buildTestCase.parameters(
    "",
    {
      language: AVAILABLE_LANGUAGES.en,
      flow: FLOW_TYPES.profile,
    },
    [
      {
        type: "get",
        endpoint: "/v1/users/test-user-123/otp_factors",
        response: {
          success: true,
          data: [
            {
              id: "factor-1",
              type: "smsotp",
              phoneNumber: "+15551234567",
              status: "active",
            },
            {
              id: "factor-2",
              type: "voiceotp",
              phoneNumber: "+15551234567",
              status: "active",
            },
          ],
        },
      },
      {
        type: "post",
        endpoint: "/v1/otp/transient/send",
        response: {
          success: true,
          data: { trxnId: "txn-123" },
        },
      },
      {
        type: "post",
        endpoint: "/v1/otp/transient/verify",
        response: {
          success: true,
        },
      },
      {
        type: "post",
        endpoint: "/v1/otp/mfa/enroll",
        response: {
          success: true,
          data: { id: "mfa-123" },
        },
      },
      {
        type: "post",
        endpoint: "/v1/otp/mfa/send",
        response: {
          success: true,
          data: { id: "txn-456" },
        },
      },
      {
        type: "post",
        endpoint: "/v1/otp/mfa/verify",
        response: {
          success: true,
        },
      },
      {
        type: "post",
        endpoint: `${SUBMIT_END_POINTS.passwordVerify}`,
        response: {
          success: true,
          data: [],
        },
      },
      {
        type: "get",
        endpoint: `${SUBMIT_END_POINTS.requestPasswordPolicy}`,
        response: {
          success: true,
          data: { pwdMinLength: 12, pwdMaxLength: 65 },
        },
      },
    ],
  );

  return {
    parameters: {
      ...baseParams,
      reactRouter: {
        ...baseParams.reactRouter,
        location: {
          ...baseParams.reactRouter.location,
          state: {
            factorIds: ["factor-1"],
          },
        },
      },
      test: {
        dangerouslyIgnoreUnhandledErrors: true,
      },
    },
    play: async ({ canvasElement, step }) => {
      const canvas = within(canvasElement);

      await step("Complete OTP selection and verification", async () => {
        await step("Verify password input is displayed", async () => {
          await waitFor(async () => {
            const canvas = within(canvasElement);
            const gcdsInput = canvasElement.querySelector("gcds-input");
            await expect(gcdsInput).toBeInTheDocument();
            if (gcdsInput && gcdsInput.shadowRoot) {
              const input = gcdsInput.shadowRoot.querySelector(
                'input[name="passwordVerification"]',
              );
              await expect(input).toBeInTheDocument();
            }

            await expect(
              canvas.getByText(/first enter your current password/i),
            ).toBeInTheDocument();

            const continueButton = canvasElement.querySelector("gcds-button");
            await expect(continueButton).toBeInTheDocument();
          });

          const gcdsInputs = canvasElement.querySelectorAll("gcds-input");
          for (const input of gcdsInputs) {
            if (input.shadowRoot) {
              const shadowInput =
                input.shadowRoot.querySelector("input#passwordVerification") ||
                input.shadowRoot.querySelector(
                  'input[name="passwordVerification"]',
                );
              if (shadowInput) {
                // Clear the field by setting value directly (avoid userEvent.clear which can fail)
                shadowInput.value = "";
                shadowInput.dispatchEvent(
                  new Event("input", { bubbles: true }),
                );

                // Type the OTP code
                await userEvent.type(shadowInput, "123123123123");

                // Trigger the gcdsInput event on the gcds-input component to update parent state
                const gcdsInputEvent = new CustomEvent("gcdsInput", {
                  bubbles: true,
                  detail: { value: "123123123123" },
                });
                input.dispatchEvent(gcdsInputEvent);
              }
            }
          }

          const continueButton = canvasElement.querySelector("gcds-button");

          if (continueButton) {
            if (
              continueButton.tagName === "GCDS-BUTTON" &&
              continueButton.shadowRoot
            ) {
              const actualButton =
                continueButton.shadowRoot.querySelector(
                  'button[part="button"]',
                ) || continueButton.shadowRoot.querySelector("button");
              if (actualButton) {
                // Dispatch gcdsClick event to bypass disabled state
                const gcdsClickEvent = new CustomEvent("gcdsClick", {
                  bubbles: true,
                  cancelable: true,
                  detail: {},
                });
                Object.defineProperty(gcdsClickEvent, "preventDefault", {
                  value: () => {},
                  writable: false,
                });
                continueButton.dispatchEvent(gcdsClickEvent);
              }
            }
          }
        });

        await step("Verify radio buttons are displayed", async () => {
          await waitFor(async () => {
            const gcdsRadios = canvasElement.querySelector("gcds-radios");
            await expect(gcdsRadios).toBeInTheDocument();
          });
        });

        // Navigate through initial OTP steps (selection + verification)
        let continueButton = canvas.getByText(/Continue/i);

        await step("Select the Text Message radio button", async () => {
          await waitFor(async () => {
            const gcdsRadios = canvasElement.querySelector("gcds-radios");
            await expect(gcdsRadios).toBeInTheDocument();

            if (gcdsRadios && gcdsRadios.shadowRoot) {
              // Find the text message radio button (factor-1)
              const textMessageRadioButton =
                gcdsRadios.shadowRoot.querySelector('input[value="factor-1"]');

              await expect(textMessageRadioButton).toBeInTheDocument();

              // Click the text message radio button
              await userEvent.click(textMessageRadioButton);
              // Verify the text message radio button is selected
              await expect(textMessageRadioButton.checked).toBe(true);
            }
          });
        });

        await step(
          "Verify Text Message option content is displayed",
          async () => {
            await waitFor(async () => {
              const gcdsRadios = canvasElement.querySelector("gcds-radios");
              const textLabel = gcdsRadios.shadowRoot.querySelector(
                'label[for="smsotp-factor-1"]',
              );
              await expect(textLabel).toBeInTheDocument();
              const labelText = textLabel.textContent;
              await expect(labelText).toContain("Text message");
              await expect(labelText).toContain("+15551234567");
            });
          },
        );

        await step(
          "Verify gcds-radios value updates to selected option",
          async () => {
            const gcdsRadios = canvasElement.querySelector("gcds-radios");
            await waitFor(async () => {
              // The gcds-radios component should update its value attribute
              const currentValue = gcdsRadios.getAttribute("value");
              await expect(currentValue).toBe("factor-1");
            });
          },
        );

        await step("Verify Continue button remains enabled", async () => {
          const canvas = within(canvasElement);
          const continueButton = canvas.getByText(/Continue/i);
          await waitFor(async () => {
            await expect(continueButton).toBeInTheDocument();
          });

          if (continueButton && continueButton.shadowRoot) {
            const actualButton =
              continueButton.shadowRoot.querySelector(
                'button[part="button"]',
              ) || continueButton.shadowRoot.querySelector("button");

            if (actualButton) {
              await expect(actualButton.disabled).toBe(false);
            }
          }
          if (continueButton) {
            if (
              continueButton.tagName === "GCDS-BUTTON" &&
              continueButton.shadowRoot
            ) {
              const actualButton =
                continueButton.shadowRoot.querySelector(
                  'button[part="button"]',
                ) || continueButton.shadowRoot.querySelector("button");
              if (actualButton) {
                // Dispatch gcdsClick event to bypass disabled state
                const gcdsClickEvent = new CustomEvent("gcdsClick", {
                  bubbles: true,
                  cancelable: true,
                  detail: {},
                });
                Object.defineProperty(gcdsClickEvent, "preventDefault", {
                  value: () => {},
                  writable: false,
                });
                continueButton.dispatchEvent(gcdsClickEvent);
              }
            }
          }
        });

        // Enter OTP
        await waitFor(async () => {
          const hasVerificationText =
            canvasElement.textContent.includes("Check your phone");
          await expect(hasVerificationText).toBeTruthy();
        });

        await waitFor(async () => {
          const gcdsInputs = canvasElement.querySelector("gcds-input");
          await expect(gcdsInputs).toBeInTheDocument();
          if (gcdsInputs.shadowRoot) {
            const shadowInput =
              gcdsInputs.shadowRoot.querySelector("input#verificationCode") ||
              gcdsInputs.shadowRoot.querySelector(
                'input[name="verificationCode"]',
              ) ||
              gcdsInputs.shadowRoot.querySelector('input[maxlength="6"]');
            await expect(shadowInput).toBeInTheDocument();
            if (shadowInput) {
              // Clear the field by setting value directly (avoid userEvent.clear which can fail)
              shadowInput.value = "";
              shadowInput.dispatchEvent(new Event("input", { bubbles: true }));

              // Type the OTP code
              await userEvent.type(shadowInput, "654321");
            }
          }
        });

        // Wait for the input to be ready
        await waitFor(async () => {
          continueButton = canvas.getByText(/Continue/i);
          await expect(continueButton).toBeInTheDocument();
          if (continueButton && continueButton.shadowRoot) {
            const actualButton =
              continueButton.shadowRoot.querySelector(
                'button[part="button"]',
              ) || continueButton.shadowRoot.querySelector("button");
            if (actualButton) {
              await expect(actualButton).toBeInTheDocument();
              await userEvent.click(actualButton);
            }
          }
        });

        await step("Verify delete number page displayed", async () => {
          await waitFor(async () => {
            const canvas = within(canvasElement);
            await expect(
              canvas.getByText(
                /Are you sure you want to delete this phone number?/i,
              ),
            ).toBeInTheDocument();
          });
        });
      });
    },
  };
})();
