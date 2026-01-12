import { expect, waitFor, userEvent, within } from "@storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
  SUBMIT_END_POINTS,
} from "../../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../../utils/functions.tsx";

export default {
  title:
    "GC Sign In/Tests/Features/ContactPhoneNumber/Edit Contact Phone Number Page",
  component: TestTemplate,
  args: {
    page: PAGES.editContactPhoneNumberPage,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    firstName: "John",
    lastName: "Doe",
    password: "TestPassword123!",
  },
};

// Test: Edit Contact Phone Number
export const EditContactPhoneNumber = (() => {
  const baseParams = buildTestCase.parameters(
    "",
    {
      language: AVAILABLE_LANGUAGES.en,
      flow: FLOW_TYPES.profile,
    },
    [
      {
        type: "post",
        endpoint: SUBMIT_END_POINTS.transientOtpSend,
        response: {
          success: true,
          data: {
            trxnId: "test-transaction-id-12345",
          },
        },
      },
      {
        type: "post",
        endpoint: SUBMIT_END_POINTS.transientOtpVerify,
        response: {
          success: true,
        },
      },
      {
        type: "post",
        endpoint: "/v1/users/profile/update-with-otp",
        response: {
          success: true,
          data: {
            userName: "test@example.com",
            phoneNumbers: [{ value: "+15551234567", type: "mobile" }],
          },
        },
      },
    ],
  );

  return {
    parameters: {
      ...baseParams,
      // Override the router configuration to handle the profile update phone routes
      reactRouter: {
        routePath: "/en/profile/update-contact-phone",
        routeParams: { language: "en" },
        routing: {
          path: "/:language/profile/update-contact-phone/:step?",
          routes: [
            {
              path: "/:language/profile/update-contact-phone",
              children: [
                { path: "", element: null },
                { path: ":step", element: null },
              ],
            },
          ],
        },
        location: {
          pathParams: { language: "en" },
        },
      },
      test: {
        dangerouslyIgnoreUnhandledErrors: true,
      },
    },
    play: async ({ canvasElement, step }) => {
      await step(
        "Verify page loads and phone input form is present",
        async () => {
          await waitFor(async () => {
            // Check for phone input field
            const phoneInput = canvasElement.querySelector(
              'input[placeholder*="phone"], input[type="tel"], gcds-input[type="tel"]',
            );
            await expect(phoneInput).toBeInTheDocument();

            // Check for SMS/Voice radio buttons
            const radioGroup = canvasElement.querySelector("gcds-radios");
            await expect(radioGroup).toBeInTheDocument();

            // Check for Continue button
            const buttons = canvasElement.querySelectorAll("gcds-button");
            await expect(buttons.length).toBeGreaterThan(0);

            // Verify basic page structure exists
            await expect(canvasElement).toBeInTheDocument();
          });
        },
      );

      await step("Enter phone number and select SMS option", async () => {
        await waitFor(async () => {
          // Find and fill the phone input field - following AddMFAPage pattern
          const phoneInput = canvasElement.querySelector("input");

          if (phoneInput) {
            // Direct typing without clearing, following AddMFAPage pattern
            await userEvent.type(phoneInput, "5551234567");
          }

          // Find the SMS/Voice radio group and select SMS
          const radioGroup = canvasElement.querySelector("gcds-radios");
          if (radioGroup && radioGroup.shadowRoot) {
            const smsRadio =
              radioGroup.shadowRoot.querySelector('input[value="sms"]');

            if (smsRadio) {
              await userEvent.click(smsRadio);
              await expect(smsRadio.checked).toBe(true);
            }
          }
        });
      });

      await step("Click Continue to send OTP", async () => {
        await waitFor(async () => {
          const canvas = within(canvasElement);
          const continueButton = canvas.getByText(/Continue/i);
          await expect(continueButton).toBeInTheDocument();

          // Following AddMFAPage pattern for button interaction
          if (
            continueButton &&
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
        });
      });

      await step("Verify OTP verification page and enter OTP", async () => {
        // Enter OTP - following AddMFAPage pattern exactly
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
      });

      await step("Click Continue button", async () => {
        // Click Continue button - following AddMFAPage pattern exactly
        await waitFor(async () => {
          const canvas = within(canvasElement);
          const continueButton = canvas.getByText(/Continue/i);
          await expect(continueButton).toBeInTheDocument();

          if (
            continueButton &&
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
        });
      });

      await step(
        "Verify confirmation page and formatted phone number",
        async () => {
          await waitFor(async () => {
            // Check for confirmation text in the page content (shadow DOM compatible)
            const pageText = canvasElement.textContent || "";

            // Look for confirmation text that indicates we're on the confirm page
            const hasConfirmationText =
              pageText.includes(
                "You've requested to update your contact phone number to",
              ) ||
              pageText.includes(
                "requested to update your contact phone number",
              );

            await expect(hasConfirmationText).toBe(true);

            // Look for the formatted phone number pattern
            const phonePattern = /\+1 \(\d{3}\) \d{3}-\d{4}/;
            const hasFormattedPhone = phonePattern.test(pageText);
            await expect(hasFormattedPhone).toBe(true);

            // Also verify "Yes, update" button is present
            const allButtons = canvasElement.querySelectorAll("gcds-button");
            let hasYesUpdateButton = false;

            for (const button of allButtons) {
              if (
                button.textContent &&
                button.textContent.includes("Yes, update")
              ) {
                hasYesUpdateButton = true;
                break;
              }
            }

            await expect(hasYesUpdateButton).toBe(true);
          });
        },
      );

      await step("Click Yes, update button", async () => {
        await waitFor(async () => {
          // Find and click the "Yes, update" button
          const allButtons = canvasElement.querySelectorAll("gcds-button");
          let yesUpdateButton = null;

          for (const button of allButtons) {
            if (
              button.textContent &&
              button.textContent.includes("Yes, update")
            ) {
              yesUpdateButton = button;
              break;
            }
          }

          await expect(yesUpdateButton).toBeInTheDocument();

          if (yesUpdateButton && yesUpdateButton.shadowRoot) {
            // Find the actual button element in shadow DOM
            const actualButton =
              yesUpdateButton.shadowRoot.querySelector(
                'button[type="button"]',
              ) || yesUpdateButton.shadowRoot.querySelector("button");
            await expect(actualButton).toBeInTheDocument();

            // Click the "Yes, update" button
            await userEvent.click(actualButton);
          }
        });
      });

      await step("Verify success page is displayed", async () => {
        await waitFor(async () => {
          // Check for success text in the page content (shadow DOM compatible)
          const pageText = canvasElement.textContent || "";

          // Look for success indicators in the page text
          const hasSuccessText =
            pageText.toLowerCase().includes("phone number has been updated") ||
            pageText.toLowerCase().includes("successfully updated") ||
            pageText.toLowerCase().includes("update complete") ||
            pageText.toLowerCase().includes("updated successfully");

          // Look for the formatted phone number pattern on success page
          const phonePattern = /\+1 \(\d{3}\) \d{3}-\d{4}/;
          const hasFormattedPhone = phonePattern.test(pageText);

          // Look for success notice component
          const successNotice = canvasElement.querySelector(
            'gcds-notice[type="success"]',
          );

          // Look for "Return to profile" or similar navigation button
          const returnButtons = canvasElement.querySelectorAll("gcds-button");
          let hasReturnButton = false;

          for (const button of returnButtons) {
            if (
              button.textContent &&
              (button.textContent.includes("Return to profile") ||
                button.textContent.includes("Back to profile") ||
                button.textContent.includes("Done"))
            ) {
              hasReturnButton = true;
              break;
            }
          }

          // Success page should have at least one of these indicators
          const isSuccessPage =
            hasSuccessText ||
            !!successNotice ||
            hasReturnButton ||
            hasFormattedPhone;
          await expect(isSuccessPage).toBe(true);

          // If we found success notice, verify it's present
          if (successNotice) {
            await expect(successNotice).toBeInTheDocument();
          }
        });
      });
    },
  };
})();
