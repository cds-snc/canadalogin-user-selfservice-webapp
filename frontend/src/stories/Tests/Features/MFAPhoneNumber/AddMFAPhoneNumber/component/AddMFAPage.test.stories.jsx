import { expect, userEvent, waitFor, within } from "@storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
  SUBMIT_END_POINTS,
} from "../../../../../../utils/constants";
import { buildTestCase, TestTemplate } from "../../../../utils/functions.tsx";
const FUTURE_OTP_EXPIRY = new Date(Date.now() + 60_000).toISOString();

export default {
  title:
    "GC Sign In/Tests/Features/MFAPhoneNumber/AddMFAPhoneNumber/Add MFA Page",
  component: TestTemplate,
  args: {
    page: PAGES.addMFAPage,
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

// Test: Select Voice Call factor link with multiple factors
export const SelectVoiceCallLink = (() => {
  const baseParams = buildTestCase.parameters(
    "",
    {
      language: AVAILABLE_LANGUAGES.en,
      flow: FLOW_TYPES.profile,
    },
    [
      {
        type: "get",
        endpoint: "/v1/users/otp_factors",
        response: {
          success: true,
          data: [
            {
              id: "factor-1",
              type: "smsotp",
              destination: "+15551234567",
              status: "active",
            },
            {
              id: "factor-2",
              type: "voiceotp",
              destination: "+15559876543",
              status: "active",
            },
          ],
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
      {
        type: "post",
        endpoint: `${SUBMIT_END_POINTS.transientOtpSend}`,
        response: {
          success: true,
          data: { trxnId: "txn-123", expiry: FUTURE_OTP_EXPIRY },
        },
      },
    ],
  );

  return {
    parameters: {
      ...baseParams,
      test: {
        dangerouslyIgnoreUnhandledErrors: true,
      },
    },
    play: async ({ canvasElement, step }) => {
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
              shadowInput.dispatchEvent(new Event("input", { bubbles: true }));

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

      await step("Verify factor selection links are displayed", async () => {
        await waitFor(async () => {
          const gcdsLinks = canvasElement.querySelectorAll("gcds-link");
          await expect(gcdsLinks.length).toBeGreaterThan(0);
        });
      });

      await step("Select the Voice Call factor", async () => {
        await waitFor(async () => {
          const factorLinks = canvasElement.querySelectorAll("gcds-link");
          const callMeLink = Array.from(factorLinks).find(
            (link) => link.textContent.trim() === "Call me",
          );
          await expect(callMeLink).toBeInTheDocument();
          const gcdsClickEvent = new CustomEvent("gcdsClick", {
            bubbles: true,
            cancelable: true,
            detail: {},
          });
          callMeLink.dispatchEvent(gcdsClickEvent);
        });
      });

      await step("Verify digit verification text is displayed", async () => {
        await waitFor(async () => {
          const canvas = within(canvasElement);
          const hasAddPhoneText = canvas.getByText(
            /We have sent a 6-digit verification code via voice call to/i,
          );
          await expect(hasAddPhoneText).toBeTruthy();
        });
      });
    },
  };
})();

export const SelectTextMessageLink = (() => {
  const baseParams = buildTestCase.parameters(
    "",
    {
      language: AVAILABLE_LANGUAGES.en,
      flow: FLOW_TYPES.profile,
    },
    [
      {
        type: "get",
        endpoint: "/v1/users/otp_factors",
        response: {
          success: true,
          data: [
            {
              id: "factor-1",
              type: "smsotp",
              destination: "+15559876543",
              status: "active",
            },
            {
              id: "factor-2",
              type: "voiceotp",
              destination: "+15559876543",
              status: "active",
            },
          ],
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
      {
        type: "post",
        endpoint: `${SUBMIT_END_POINTS.transientOtpSend}`,
        response: {
          success: true,
          data: { trxnId: "txn-123", expiry: FUTURE_OTP_EXPIRY },
        },
      },
    ],
  );

  return {
    parameters: {
      ...baseParams,
      test: {
        dangerouslyIgnoreUnhandledErrors: true,
      },
    },
    play: async ({ canvasElement, step }) => {
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
              shadowInput.dispatchEvent(new Event("input", { bubbles: true }));

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

      await step("Verify factor selection links are displayed", async () => {
        await waitFor(async () => {
          const gcdsLinks = canvasElement.querySelectorAll("gcds-link");
          await expect(gcdsLinks.length).toBeGreaterThan(0);
        });
      });

      await step("Select the Text Message factor", async () => {
        await waitFor(async () => {
          const factorLinks = canvasElement.querySelectorAll("gcds-link");
          const textMeLink = Array.from(factorLinks).find(
            (link) => link.textContent.trim() === "Text me",
          );
          await expect(textMeLink).toBeInTheDocument();
          const gcdsClickEvent = new CustomEvent("gcdsClick", {
            bubbles: true,
            cancelable: true,
            detail: {},
          });
          textMeLink.dispatchEvent(gcdsClickEvent);
        });
      });

      await step("Verify digit verification text is displayed", async () => {
        const canvas = within(canvasElement);
        await waitFor(async () => {
          const hasAddPhoneText = canvas.getByText(
            /We have sent a text message with a 6-digit verification code to/i,
          );
          await expect(hasAddPhoneText).toBeTruthy();
        });
      });
    },
  };
})();

// Test: Complete Add MFA flow with SMS
export const CompleteAddMFAFlowSMS = (() => {
  const baseParams = buildTestCase.parameters(
    "",
    {
      language: AVAILABLE_LANGUAGES.en,
      flow: FLOW_TYPES.profile,
    },
    [
      {
        type: "get",
        endpoint: "/v1/users/otp_factors",
        response: {
          success: true,
          data: [
            {
              id: "factor-1",
              type: "smsotp",
              destination: "+15551234567",
              status: "active",
            },
            {
              id: "factor-2",
              type: "voiceotp",
              destination: "+15551234567",
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
          data: { trxnId: "txn-123", expiry: FUTURE_OTP_EXPIRY },
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

        await step("Verify factor selection links are displayed", async () => {
          await waitFor(async () => {
            const gcdsLinks = canvasElement.querySelectorAll("gcds-link");
            await expect(gcdsLinks.length).toBeGreaterThan(0);
          });
        });

        // Navigate through initial OTP steps (selection + verification)
        let continueButton;

        await step("Select the Text Message factor", async () => {
          await waitFor(async () => {
            const factorLinks = canvasElement.querySelectorAll("gcds-link");
            const textMeLink = Array.from(factorLinks).find(
              (link) => link.textContent.trim() === "Text me",
            );
            await expect(textMeLink).toBeInTheDocument();
            const gcdsClickEvent = new CustomEvent("gcdsClick", {
              bubbles: true,
              cancelable: true,
              detail: {},
            });
            textMeLink.dispatchEvent(gcdsClickEvent);
          });
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
      });

      await step("Enter new MFA phone number", async () => {
        await waitFor(async () => {
          await expect(
            canvasElement.querySelector("input"),
          ).toBeInTheDocument();
        });

        const phoneInput = canvasElement.querySelector("input");
        if (phoneInput) {
          // Clear existing value and type new phone number
          await userEvent.type(phoneInput, "5559998888");
        }
      });

      await step("Submit phone number to enroll MFA", async () => {
        let continueButton = canvas.getByText(/Continue/i);
        if (
          continueButton &&
          continueButton.tagName === "GCDS-BUTTON" &&
          continueButton.shadowRoot
        ) {
          const actualButton =
            continueButton.shadowRoot.querySelector('button[part="button"]') ||
            continueButton.shadowRoot.querySelector("button");
          if (actualButton && !actualButton.disabled) {
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
      });

      await step("Verify Add MFA Phone Number step is displayed", async () => {
        await waitFor(async () => {
          const hasAddPhoneText = canvas.getByText(/Check your phone/i);
          await expect(hasAddPhoneText).toBeTruthy();
        });
      });

      await step("Complete MFA OTP verification", async () => {
        // Enter MFA OTP code
        await waitFor(async () => {
          const gcdsInput = canvasElement.querySelector("gcds-input");
          await expect(gcdsInput).toBeInTheDocument();
          if (gcdsInput.shadowRoot) {
            const shadowInput =
              gcdsInput.shadowRoot.querySelector("input#verificationCode") ||
              gcdsInput.shadowRoot.querySelector(
                'input[name="verificationCode"]',
              ) ||
              gcdsInput.shadowRoot.querySelector('input[maxlength="6"]');
            await expect(shadowInput).toBeInTheDocument();
            if (shadowInput) {
              shadowInput.value = "";
              shadowInput.dispatchEvent(new Event("input", { bubbles: true }));
              await userEvent.type(shadowInput, "654321");
            }
          }
        });

        // Submit MFA OTP
        await waitFor(async () => {
          const continueButton = canvas.getByText(/Continue/i);
          await expect(continueButton).toBeInTheDocument();
          if (continueButton && continueButton.shadowRoot) {
            const actualButton =
              continueButton.shadowRoot.querySelector(
                'button[part="button"]',
              ) || continueButton.shadowRoot.querySelector("button");
            if (actualButton) {
              await userEvent.click(actualButton);
            }
          }
        });

        // Wait for navigation/state change
        await waitFor(async () => {
          const hasVerificationText = canvasElement.textContent.includes(
            "Set up voice call verification",
          );
          await expect(hasVerificationText).toBeTruthy();
        });
      });

      await step("Verify set up second MFA is displayed", async () => {
        await waitFor(async () => {
          const hasAddPhoneText = canvasElement.textContent.includes(
            "Yes, set up voice call verification",
          );
          await expect(hasAddPhoneText).toBeTruthy();
        });
      });

      await step("Set up voice second MFA", async () => {
        let continueButton = canvas.getByText(
          /Yes, set up voice call verification/i,
        );
        if (
          continueButton &&
          continueButton.tagName === "GCDS-BUTTON" &&
          continueButton.shadowRoot
        ) {
          const actualButton =
            continueButton.shadowRoot.querySelector('button[part="button"]') ||
            continueButton.shadowRoot.querySelector("button");
          if (actualButton && !actualButton.disabled) {
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

            // Wait for navigation to voice call verification
            await waitFor(async () => {
              const hasVoiceText = canvas.getByText(
                /We have sent a 6-digit verification code via voice call to/i,
              );
              await expect(hasVoiceText).toBeInTheDocument();
            });
          }
        }
      });
    },
  };
})();

export const ResendOtpCode = (() => {
  const baseParams = buildTestCase.parameters(
    "",
    {
      language: AVAILABLE_LANGUAGES.en,
      flow: FLOW_TYPES.profile,
    },
    [
      {
        type: "get",
        endpoint: "/v1/users/otp_factors",
        response: {
          success: true,
          data: [
            {
              id: "factor-1",
              type: "smsotp",
              destination: "+15551234567",
              status: "active",
            },
            {
              id: "factor-2",
              type: "voiceotp",
              destination: "+15551234567",
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
          data: { trxnId: "txn-123", expiry: FUTURE_OTP_EXPIRY },
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

        await step("Verify factor selection links are displayed", async () => {
          await waitFor(async () => {
            const gcdsLinks = canvasElement.querySelectorAll("gcds-link");
            await expect(gcdsLinks.length).toBeGreaterThan(0);
          });
        });

        await step("Select the Text Message factor", async () => {
          await waitFor(async () => {
            const factorLinks = canvasElement.querySelectorAll("gcds-link");
            const textMeLink = Array.from(factorLinks).find(
              (link) => link.textContent.trim() === "Text me",
            );
            await expect(textMeLink).toBeInTheDocument();
            const gcdsClickEvent = new CustomEvent("gcdsClick", {
              bubbles: true,
              cancelable: true,
              detail: {},
            });
            textMeLink.dispatchEvent(gcdsClickEvent);
          });
        });
      });
      await step("Test resend OTP functionality", async () => {
        // Wait for navigation to resend OTP screen
        await waitFor(async () => {
          await expect(
            canvas.getByText(/Request a new code in/i),
          ).toBeInTheDocument();
          await expect(
            canvas.getByText(/Your code will expire in/i),
          ).toBeInTheDocument();
        });
        await waitFor(
          async () => {
            const resendLinks = canvasElement.querySelectorAll("gcds-link");
            const resendLink = Array.from(resendLinks).find((link) =>
              link.textContent.includes("Request a new code"),
            );
            await expect(resendLink).toBeInTheDocument();

            // Click the gcds-link element directly or find the actual link in shadow DOM
            if (resendLink.shadowRoot) {
              const actualLink = resendLink.shadowRoot.querySelector("a");
              await expect(actualLink).toBeInTheDocument();
              await userEvent.click(actualLink);
            } else {
              await userEvent.click(resendLink);
            }
          },
          { timeout: 11000 },
        );

        // Wait for resend request to process
        await waitFor(async () => {
          await expect(
            canvas.getByText(/Request a new code in/i),
          ).toBeInTheDocument();
        });
      });
    },
  };
})();

export const UseDifferentPhoneNumber = (() => {
  const baseParams = buildTestCase.parameters(
    "",
    {
      language: AVAILABLE_LANGUAGES.en,
      flow: FLOW_TYPES.profile,
    },
    [
      {
        type: "get",
        endpoint: "/v1/users/otp_factors",
        response: {
          success: true,
          data: [
            {
              id: "factor-1",
              type: "smsotp",
              destination: "+15551234567",
              status: "active",
            },
            {
              id: "factor-2",
              type: "voiceotp",
              destination: "+15551234567",
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
          data: { trxnId: "txn-123", expiry: FUTURE_OTP_EXPIRY },
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
      {
        type: "delete",
        endpoint: "/v1/otp/mfa/delete",
        response: {
          success: true,
        },
      },
    ],
  );

  return {
    parameters: {
      ...baseParams,
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

        await step("Verify factor selection links are displayed", async () => {
          await waitFor(async () => {
            const gcdsLinks = canvasElement.querySelectorAll("gcds-link");
            await expect(gcdsLinks.length).toBeGreaterThan(0);
          });
        });

        await step("Select the Text Message factor", async () => {
          await waitFor(async () => {
            const factorLinks = canvasElement.querySelectorAll("gcds-link");
            const textMeLink = Array.from(factorLinks).find(
              (link) => link.textContent.trim() === "Text me",
            );
            await expect(textMeLink).toBeInTheDocument();
            const gcdsClickEvent = new CustomEvent("gcdsClick", {
              bubbles: true,
              cancelable: true,
              detail: {},
            });
            textMeLink.dispatchEvent(gcdsClickEvent);
          });
        });
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
        let continueButton = canvas.getByText(/Continue/i);
        continueButton = canvas.getByText(/Continue/i);
        await expect(continueButton).toBeInTheDocument();
        if (continueButton && continueButton.shadowRoot) {
          const actualButton =
            continueButton.shadowRoot.querySelector('button[part="button"]') ||
            continueButton.shadowRoot.querySelector("button");
          if (actualButton) {
            await expect(actualButton).toBeInTheDocument();
            await userEvent.click(actualButton);
          }
        }
      });

      await step("Enter new MFA phone number", async () => {
        await waitFor(async () => {
          await expect(
            canvasElement.querySelector("input"),
          ).toBeInTheDocument();
        });

        const phoneInput = canvasElement.querySelector("input");
        if (phoneInput) {
          // Clear existing value and type new phone number
          await userEvent.type(phoneInput, "5559998888");
        }
      });

      await step("Submit phone number to enroll MFA", async () => {
        let continueButton = canvas.getByText(/Continue/i);
        if (
          continueButton &&
          continueButton.tagName === "GCDS-BUTTON" &&
          continueButton.shadowRoot
        ) {
          const actualButton =
            continueButton.shadowRoot.querySelector('button[part="button"]') ||
            continueButton.shadowRoot.querySelector("button");
          if (actualButton && !actualButton.disabled) {
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
      });

      await step("Test use different phone number link", async () => {
        await waitFor(async () => {
          // Use canvas.getByText to directly find the link by its text content
          let differentPhoneNumberLink = canvas.getByText(
            "Use a different phone number",
          );
          await expect(differentPhoneNumberLink).toBeInTheDocument();

          // Verify we found the correct gcds-link element
          if (
            differentPhoneNumberLink &&
            differentPhoneNumberLink.tagName !== "GCDS-LINK"
          ) {
            // If canvas.getByText found a text node or different element, find the parent gcds-link
            differentPhoneNumberLink =
              differentPhoneNumberLink.closest("gcds-link");
          }

          await expect(differentPhoneNumberLink).toBeInTheDocument();

          // Click the gcds-link element directly or find the actual link in shadow DOM
          if (differentPhoneNumberLink.shadowRoot) {
            const actualLink =
              differentPhoneNumberLink.shadowRoot.querySelector("a");
            await expect(actualLink).toBeInTheDocument();
            await userEvent.click(actualLink);
          } else {
            await userEvent.click(differentPhoneNumberLink);
          }
        });

        // Wait for navigation to complete
        await waitFor(async () => {
          await expect(
            canvas.getByText(/Add a phone number/i),
          ).toBeInTheDocument();
        });
      });
    },
  };
})();
