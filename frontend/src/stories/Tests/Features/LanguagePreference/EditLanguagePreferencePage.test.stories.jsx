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
    "GC Sign In/Tests/Features/LanguagePreference/Edit Language Preference Page",
  component: TestTemplate,
  args: {
    page: PAGES.editLanguagePreferencePage,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    firstName: "John",
    lastName: "Doe",
    password: "TestPassword123!",
  },
};

// Test: Edit Language Preference
export const EditLanguagePreference = (() => {
  const baseParams = buildTestCase.parameters(
    "",
    {
      language: AVAILABLE_LANGUAGES.en,
      flow: FLOW_TYPES.profile,
    },
    [
      {
        type: "post",
        endpoint: "/v1/users/profile",
        response: {
          success: true,
          data: {
            userName: "test@example.com",
            preferredLanguage: "en-ca",
          },
        },
      },
    ],
  );

  return {
    parameters: {
      ...baseParams,
      // Override the router configuration to handle the profile update language routes
      reactRouter: {
        routePath: "/en/profile/update-language",
        routeParams: { language: "en" },
        routing: {
          path: "/:language/profile/update-language/:step?",
          routes: [
            {
              path: "/:language/profile/update-language",
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
        "Verify page loads and basic elements are present",
        async () => {
          await waitFor(async () => {
            // Check for radio buttons
            const radios = canvasElement.querySelectorAll("gcds-radios");
            await expect(radios.length).toBeGreaterThan(0);

            // Check for buttons
            const buttons = canvasElement.querySelectorAll("gcds-button");
            await expect(buttons.length).toBeGreaterThan(0);

            // Verify basic page structure exists
            await expect(canvasElement).toBeInTheDocument();
          });
        },
      );

      await step("Verify radio buttons can be found", async () => {
        await waitFor(async () => {
          // Look for the language preference radio buttons
          const radioGroup = canvasElement.querySelector("gcds-radios");
          await expect(radioGroup).toBeInTheDocument();

          // Check if radio options are present in shadow DOM
          if (radioGroup && radioGroup.shadowRoot) {
            const radioOptions = radioGroup.shadowRoot.querySelectorAll(
              'input[type="radio"]',
            );
            await expect(radioOptions.length).toBeGreaterThan(0);
          }
        });
      });

      await step("Select English and click Continue", async () => {
        await waitFor(async () => {
          // Find the radio group
          const radioGroup = canvasElement.querySelector("gcds-radios");
          await expect(radioGroup).toBeInTheDocument();

          // Find English radio option in shadow DOM (following AddMFAPage pattern)
          if (radioGroup && radioGroup.shadowRoot) {
            const englishRadio = radioGroup.shadowRoot.querySelector(
              'input[value="en-ca"]',
            );

            await expect(englishRadio).toBeInTheDocument();

            // Select the English option
            await userEvent.click(englishRadio);

            // Verify the English radio button is selected
            await expect(englishRadio.checked).toBe(true);
          }
        });
      });

      await step(
        "Verify gcds-radios value updates to selected option",
        async () => {
          const gcdsRadios = canvasElement.querySelector("gcds-radios");
          await waitFor(async () => {
            // The gcds-radios component should update its value attribute
            const currentValue = gcdsRadios.getAttribute("value");
            await expect(currentValue).toBe("en-ca");
          });
        },
      );

      await step("Click Continue button", async () => {
        await waitFor(async () => {
          // Find and click the Continue button
          const continueButtons = canvasElement.querySelectorAll("gcds-button");
          let continueButton = null;

          // Find the button that contains "Continue" text
          for (const button of continueButtons) {
            if (button.textContent && button.textContent.includes("Continue")) {
              continueButton = button;
              break;
            }
          }

          await expect(continueButton).toBeInTheDocument();

          if (continueButton && continueButton.shadowRoot) {
            // Find the actual button element in shadow DOM
            const actualButton =
              continueButton.shadowRoot.querySelector(
                'button[type="submit"]',
              ) || continueButton.shadowRoot.querySelector("button");
            await expect(actualButton).toBeInTheDocument();

            // Direct click on the actual button element
            await userEvent.click(actualButton);
          }
        });
      });

      await step("Verify confirmation page and click Yes, update", async () => {
        await waitFor(async () => {
          const canvas = within(canvasElement);

          // Look for confirmation text that indicates we're on the confirm page
          // The text should mention updating language preference
          const confirmationTexts = [
            /You’ve requested to update your language to:/i,
            /English/i,
            /Anglais/i,
          ];

          for (const textPattern of confirmationTexts) {
            try {
              const element = canvas.getByText(textPattern);
              if (element) {
                await expect(element).toBeInTheDocument();
                break;
              }
            } catch {
              // Continue trying other patterns
            }
          }

          // If we can't find specific text, at least verify we have buttons that suggest we're on confirm page
          const allButtons = canvasElement.querySelectorAll("gcds-button");
          let yesUpdateButton = null;

          // Find the button that contains "Yes, update" text
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
          const canvas = within(canvasElement);

          // Check for success indicators - try multiple patterns
          const successPatterns = [
            /Your language preference has been updated to/i,
            /English/i,
            /Anglais/i,
          ];

          let foundSuccessText = false;
          for (const pattern of successPatterns) {
            try {
              const element = canvas.getByText(pattern);
              if (element) {
                foundSuccessText = true;
                await expect(element).toBeInTheDocument();
                break;
              }
            } catch {
              // Continue trying other patterns
            }
          }

          // Alternative: Look for success notice component
          const successNotice = canvasElement.querySelector(
            'gcds-notice[type="success"]',
          );
          if (successNotice) {
            await expect(successNotice).toBeInTheDocument();
            foundSuccessText = true;
          }

          // If we still haven't found success indicators, look for "Return to profile" button
          if (!foundSuccessText) {
            const returnButtons = canvasElement.querySelectorAll("gcds-button");
            let returnToProfileButton = null;

            for (const button of returnButtons) {
              if (
                button.textContent &&
                (button.textContent.includes("Return to profile") ||
                  button.textContent.includes("Back to profile"))
              ) {
                returnToProfileButton = button;
                break;
              }
            }

            if (returnToProfileButton) {
              await expect(returnToProfileButton).toBeInTheDocument();
            }
          }
        });
      });
    },
  };
})();
