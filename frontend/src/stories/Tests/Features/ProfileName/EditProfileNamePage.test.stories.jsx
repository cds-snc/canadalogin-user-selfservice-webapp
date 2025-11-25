import { expect, waitFor, userEvent, within } from "@storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
  SUBMIT_END_POINTS,
} from "../../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../../utils/functions.tsx";

export default {
  title: "GC Sign In/Tests/Features/ProfileName/Edit Profile Name Page",
  component: TestTemplate,
  args: {
    page: PAGES.editProfileNamePage,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    firstName: "John",
    lastName: "Doe",
    password: "TestPassword123!",
  },
};

// Test: Edit Profile Name
export const EditProfileName = (() => {
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
            name: {
              givenName: "John",
              familyName: "Smith",
              formatted: "John Smith",
            },
          },
        },
      },
    ],
  );

  return {
    parameters: {
      ...baseParams,
      // Override the router configuration to handle the profile update name routes
      reactRouter: {
        routePath: "/en/profile/update-name",
        routeParams: { language: "en" },
        routing: {
          path: "/:language/profile/update-name/:step?",
          routes: [
            {
              path: "/:language/profile/update-name",
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
            // Check for input elements
            const inputs = canvasElement.querySelectorAll("gcds-input");
            await expect(inputs.length).toBeGreaterThan(0);

            // Check for buttons
            const buttons = canvasElement.querySelectorAll("gcds-button");
            await expect(buttons.length).toBeGreaterThan(0);

            // Verify basic page structure exists
            await expect(canvasElement).toBeInTheDocument();
          });
        },
      );

      await step("Verify inputs can be found by data-testid", async () => {
        await waitFor(async () => {
          // Look for inputs by their data-testid attributes
          const givenNameInput = canvasElement.querySelector(
            '[data-testid="givenName"]',
          );
          const familyNameInput = canvasElement.querySelector(
            '[data-testid="familyName"]',
          );

          // Check each input individually
          await expect(givenNameInput).toBeInTheDocument();
          await expect(familyNameInput).toBeInTheDocument();
        });
      });

      await step("Enter name and click Continue", async () => {
        await waitFor(async () => {
          // Find the GCDS inputs
          const givenNameInput = canvasElement.querySelector(
            '[data-testid="givenName"]',
          );
          const familyNameInput = canvasElement.querySelector(
            '[data-testid="familyName"]',
          );

          // Handle given name input via shadow DOM
          if (givenNameInput && givenNameInput.shadowRoot) {
            const shadowInput =
              givenNameInput.shadowRoot.querySelector("input");
            if (shadowInput) {
              // Clear and set value directly
              shadowInput.value = "John";

              // Dispatch input event on the shadow input
              shadowInput.dispatchEvent(new Event("input", { bubbles: true }));
              shadowInput.dispatchEvent(new Event("change", { bubbles: true }));

              // Trigger the gcdsInput event on the gcds-input component to update parent state
              const gcdsInputEvent = new CustomEvent("gcdsInput", {
                bubbles: true,
                detail: { value: "John" },
              });
              givenNameInput.dispatchEvent(gcdsInputEvent);
            }
          }

          // Handle family name input via shadow DOM
          if (familyNameInput && familyNameInput.shadowRoot) {
            const shadowInput =
              familyNameInput.shadowRoot.querySelector("input");
            if (shadowInput) {
              // Clear and set value directly
              shadowInput.value = "Smith";

              // Dispatch input event on the shadow input
              shadowInput.dispatchEvent(new Event("input", { bubbles: true }));
              shadowInput.dispatchEvent(new Event("change", { bubbles: true }));

              // Trigger the gcdsInput event on the gcds-input component to update parent state
              const gcdsInputEvent = new CustomEvent("gcdsInput", {
                bubbles: true,
                detail: { value: "Smith" },
              });
              familyNameInput.dispatchEvent(gcdsInputEvent);
            }
          }

          // Find and click the Continue button by text content
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
            const actualButton = continueButton.shadowRoot.querySelector(
              'button[type="submit"]',
            );
            await expect(actualButton).toBeInTheDocument();

            // Direct click on the actual button element
            await userEvent.click(actualButton);
          }
        });
      });

      await step("Verify confirmation page and click Yes, update", async () => {
        await waitFor(async () => {
          const canvas = within(canvasElement);
          await expect(
            canvas.getByText(/You’ve requested to update your name to:/i),
          ).toBeInTheDocument();

          // Check that "John Smith" appears in the page
          const hasNameText = canvas.getByText(/John Smith/i);
          await expect(hasNameText).toBeInTheDocument();

          // Find the "Yes, update" button specifically
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

          // Check that the success message is present with the updated name
          const successText = canvas.getByText(
            /Your name has been updated to John Smith/i,
          );
          await expect(successText).toBeInTheDocument();
        });
      });
    },
  };
})();
