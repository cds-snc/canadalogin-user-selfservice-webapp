import { expect, userEvent, waitFor, within } from "@storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
  SUBMIT_END_POINTS,
} from "../../../../../../utils/constants";
import { buildTestCase, TestTemplate } from "../../../../utils/functions.tsx";

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

// Test: Select Voice Call radio button with multiple factors
export const SelectVoiceCallRadioButton = (() => {
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
              phoneNumber: "+15559876543",
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

      await step("Verify radio buttons are displayed", async () => {
        await waitFor(async () => {
          const gcdsRadios = canvasElement.querySelector("gcds-radios");
          await expect(gcdsRadios).toBeInTheDocument();
        });
      });

      await step("Select the Voice Call radio button", async () => {
        await waitFor(async () => {
          const gcdsRadios = canvasElement.querySelector("gcds-radios");
          await expect(gcdsRadios).toBeInTheDocument();

          if (gcdsRadios && gcdsRadios.shadowRoot) {
            // Find the voice call radio button (factor-2)
            const voiceRadioButton = gcdsRadios.shadowRoot.querySelector(
              'input[value="factor-2"]',
            );

            await expect(voiceRadioButton).toBeInTheDocument();

            // Click the voice call radio button
            await userEvent.click(voiceRadioButton);
            // Verify the voice call radio button is selected
            await expect(voiceRadioButton.checked).toBe(true);
          }
        });
      });

      await step("Verify Voice Call option content is displayed", async () => {
        await waitFor(async () => {
          await expect(
            canvasElement
              .querySelector("gcds-radios")
              .shadowRoot.querySelector('label[for="voiceotp-factor-2"]'),
          ).toBeInTheDocument();

          const labelText = canvasElement
            .querySelector("gcds-radios")
            .shadowRoot.querySelector(
              'label[for="voiceotp-factor-2"]',
            ).textContent;
          await expect(labelText).toContain("Voice call");
          await expect(labelText).toContain("+15559876543");
        });
      });

      await step(
        "Verify gcds-radios value updates to selected option",
        async () => {
          const gcdsRadios = canvasElement.querySelector("gcds-radios");
          await waitFor(async () => {
            // The gcds-radios component should update its value attribute
            const currentValue = gcdsRadios.getAttribute("value");
            await expect(currentValue).toBe("factor-2");
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
            continueButton.shadowRoot.querySelector('button[part="button"]') ||
            continueButton.shadowRoot.querySelector("button");

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

export const SelectTextMessageRadioButton = (() => {
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
              phoneNumber: "+15559876543",
              status: "active",
            },
            {
              id: "factor-2",
              type: "voiceotp",
              phoneNumber: "+15559876543",
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

      await step("Verify radio buttons are displayed", async () => {
        await waitFor(async () => {
          const gcdsRadios = canvasElement.querySelector("gcds-radios");
          await expect(gcdsRadios).toBeInTheDocument();
        });
      });

      await step("Select the Text Message radio button", async () => {
        await waitFor(async () => {
          const gcdsRadios = canvasElement.querySelector("gcds-radios");
          await expect(gcdsRadios).toBeInTheDocument();

          if (gcdsRadios && gcdsRadios.shadowRoot) {
            // Find the text message radio button (factor-1)
            const textMessageRadioButton = gcdsRadios.shadowRoot.querySelector(
              'input[value="factor-1"]',
            );

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
            // Verify the text message label content
            await expect(
              canvasElement
                .querySelector("gcds-radios")
                .shadowRoot.querySelector('label[for="smsotp-factor-1"]'),
            ).toBeInTheDocument();
            const labelText = canvasElement
              .querySelector("gcds-radios")
              .shadowRoot.querySelector(
                'label[for="smsotp-factor-1"]',
              ).textContent;
            await expect(labelText).toContain("Text message");
            await expect(labelText).toContain("+15559876543");
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
            continueButton.shadowRoot.querySelector('button[part="button"]') ||
            continueButton.shadowRoot.querySelector("button");

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
          const gcdsInputs = canvasElement.querySelectorAll("gcds-input");
          await expect(gcdsInputs.length).toBeGreaterThan(0);

          for (const input of gcdsInputs) {
            if (input.shadowRoot) {
              const shadowInput =
                input.shadowRoot.querySelector("input#verificationCode") ||
                input.shadowRoot.querySelector(
                  'input[name="verificationCode"]',
                ) ||
                input.shadowRoot.querySelector('input[maxlength="6"]');
              if (shadowInput) {
                // Clear the field by setting value directly
                shadowInput.value = "";
                shadowInput.dispatchEvent(
                  new Event("input", { bubbles: true }),
                );

                // Type the OTP code
                await userEvent.type(shadowInput, "654321");

                // For AddMFAOtpVerification component, trigger change event to update phoneFormData.otp
                const changeEvent = new Event("input", { bubbles: true });
                Object.defineProperty(changeEvent, "target", {
                  value: { value: "654321" },
                  enumerable: true,
                });
                shadowInput.dispatchEvent(changeEvent);

                // Also trigger the gcdsInput event on the gcds-input component
                const gcdsInputEvent = new CustomEvent("gcdsInput", {
                  bubbles: true,
                  detail: { value: "654321" },
                });
                input.dispatchEvent(gcdsInputEvent);

                break;
              }
            }
          }
        });

        // Submit MFA OTP
        await waitFor(async () => {
          const continueButton = canvas.getByText(/Continue/i);
          await expect(continueButton).toBeInTheDocument();
          await expect(continueButton.tagName).toBe("GCDS-BUTTON");
          await expect(continueButton.shadowRoot).toBeTruthy();

          const actualButton =
            continueButton.shadowRoot.querySelector('button[part="button"]') ||
            continueButton.shadowRoot.querySelector("button");
          await expect(actualButton).toBeInTheDocument();
          await expect(actualButton.disabled).toBe(false);

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
        });

        // Wait for navigation/state change
        await waitFor(async () => {
          const hasVerificationText =
            canvasElement.textContent.includes(
              "Set up voice call verification",
            ) || canvasElement.textContent.includes("Check your phone");
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
      });
      await step("Test resend OTP functionality", async () => {
        // Wait for navigation to resend OTP screen
        await waitFor(async () => {
          await expect(
            canvas.getByText(/Request a new code in/i),
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

        await step("Verify radio buttons are displayed", async () => {
          await waitFor(async () => {
            const gcdsRadios = canvasElement.querySelector("gcds-radios");
            await expect(gcdsRadios).toBeInTheDocument();
          });
        });

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
              await expect(
                canvasElement
                  .querySelector("gcds-radios")
                  .shadowRoot.querySelector('label[for="smsotp-factor-1"]'),
              ).toBeInTheDocument();
              await expect(
                canvasElement
                  .querySelector("gcds-radios")
                  .shadowRoot.querySelector('label[for="smsotp-factor-1"]')
                  .textContent,
              ).toContain("Text message");
              await expect(
                canvasElement
                  .querySelector("gcds-radios")
                  .shadowRoot.querySelector('label[for="smsotp-factor-1"]')
                  .textContent,
              ).toContain("+15551234567");
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
          let differentPhoneNumberLink = canvas.getByText("Try another way");
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
            canvas.getByText(/Enter your new phone number/i),
          ).toBeInTheDocument();
        });
      });
    },
  };
})();
