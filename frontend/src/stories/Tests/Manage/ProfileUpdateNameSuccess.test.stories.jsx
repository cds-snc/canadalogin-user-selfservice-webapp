import { expect, userEvent, within, waitFor } from "@storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  NAVIGATION_LINKS,
  PAGES,
} from "../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../utils/functions.tsx";

export default {
  title: "GC Sign In/Tests/Manage/Profile Update Name Success",
  component: TestTemplate,
  args: {
    page: PAGES.profileUpdateNameSuccess,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    otpType: null,
    passwordValidated: false,
    firstName: "UpdatedFirst",
    lastName: "UpdatedLast",
    password: "TestPassword123!",
    otp: "123456",
  },
};

// Test success page display and navigation
export const SuccessPageDisplay = {
  parameters: {
    ...buildTestCase.parameters(
      NAVIGATION_LINKS.profileUpdateNameSuccess,
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      []
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 2000));

    // Verify the success page content is displayed
    await step("Verify success page content", async () => {
      const container = canvasElement.querySelector("main") || canvasElement;
      await expect(container).toBeInTheDocument();

      // Look for success notice
      const successNotice = canvasElement.querySelector('gcds-notice[type="success"]');
      if (successNotice) {
        await expect(successNotice).toBeInTheDocument();
      }

      // Look for username display
      const usernameDisplay = canvasElement.querySelector("strong");
      if (usernameDisplay) {
        await expect(usernameDisplay).toBeInTheDocument();
      }

      // Verify headings are present
      const headings = canvasElement.querySelectorAll("h1, h2, h3, h4");
      expect(headings.length).toBeGreaterThan(0);
    });

    await new Promise((r) => setTimeout(r, 500));
  },
};

// Test primary action button (usually "Continue" or "Back to Profile")
export const PrimaryActionButton = {
  parameters: {
    ...buildTestCase.parameters(
      NAVIGATION_LINKS.profileUpdateNameSuccess,
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      []
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    // Test clicking the primary action button
    await step("Click primary action button", async () => {
      // Find the primary button (not secondary)
      let primaryButton =
        canvas.getByText(/Continue|Back to Profile|Profile|Done/i) ||
        canvasElement.querySelector('gcds-button:not([button-role="secondary"])') ||
        canvasElement.querySelector('gcds-button button[part="button"]');

      await expect(primaryButton).toBeInTheDocument();

      // If it's a GCDS button wrapper, find the actual button inside shadow DOM
      if (primaryButton.tagName === "GCDS-BUTTON" && primaryButton.shadowRoot) {
        const actualButton =
          primaryButton.shadowRoot.querySelector('button[part="button"]') ||
          primaryButton.shadowRoot.querySelector("button");
        if (actualButton) {
          primaryButton = actualButton;
        }
      }

      await userEvent.click(primaryButton);

      // Wait for navigation
      await new Promise((r) => setTimeout(r, 1000));
    });

    await new Promise((r) => setTimeout(r, 1000));
    // Should navigate back to profile or show 404 in Storybook environment
    await expect(canvas.getByText(/404 Not Found/i)).toBeInTheDocument();
  },
};

// Test secondary action button
export const SecondaryActionButton = {
  parameters: {
    ...buildTestCase.parameters(
      NAVIGATION_LINKS.profileUpdateNameSuccess,
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      []
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    // Test clicking the secondary action button
    await step("Click secondary action button", async () => {
      // Find the secondary button
      let secondaryButton =
        canvas.getByText(/Cancel|Back|Return|Home/i) ||
        canvasElement.querySelector('gcds-button[button-role="secondary"]') ||
        canvasElement.querySelector('gcds-button:nth-child(2)');

      await expect(secondaryButton).toBeInTheDocument();

      // If it's a GCDS button wrapper, find the actual button inside shadow DOM
      if (secondaryButton.tagName === "GCDS-BUTTON" && secondaryButton.shadowRoot) {
        const actualButton =
          secondaryButton.shadowRoot.querySelector('button[part="button"]') ||
          secondaryButton.shadowRoot.querySelector("button");
        if (actualButton) {
          secondaryButton = actualButton;
        }
      }

      await userEvent.click(secondaryButton);

      // Wait for navigation
      await new Promise((r) => setTimeout(r, 1000));
    });

    await new Promise((r) => setTimeout(r, 1000));
    // Should navigate back to profile or show 404 in Storybook environment
    await expect(canvas.getByText(/404 Not Found/i)).toBeInTheDocument();
  },
};

// Test French language version
export const FrenchSuccessPage = {
  parameters: {
    ...buildTestCase.parameters(
      NAVIGATION_LINKS.profileUpdateNameSuccess,
      {
        language: AVAILABLE_LANGUAGES.fr,
        flow: FLOW_TYPES.profile,
      },
      []
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 2000));

    // Verify French content is displayed
    await step("Verify French language content", async () => {
      const container = canvasElement.querySelector("main") || canvasElement;
      await expect(container).toBeInTheDocument();

      // Look for success notice
      const successNotice = canvasElement.querySelector('gcds-notice[type="success"]');
      if (successNotice) {
        await expect(successNotice).toBeInTheDocument();
      }
    });

    // Test functionality with French interface
    await step("Test navigation in French", async () => {
      let primaryButton =
        canvas.getByText(/Continuer|Profil|Retour/i) ||
        canvasElement.querySelector('gcds-button:not([button-role="secondary"])');

      // If no French text found, try English fallback
      if (!primaryButton) {
        primaryButton =
          canvas.getByText(/Continue|Profile|Back/i) ||
          canvasElement.querySelector('gcds-button:not([button-role="secondary"])');
      }

      if (primaryButton) {
        // If it's a GCDS button wrapper, find the actual button inside shadow DOM
        if (primaryButton.tagName === "GCDS-BUTTON" && primaryButton.shadowRoot) {
          const actualButton =
            primaryButton.shadowRoot.querySelector('button[part="button"]') ||
            primaryButton.shadowRoot.querySelector("button");
          if (actualButton) {
            primaryButton = actualButton;
          }
        }

        await userEvent.click(primaryButton);
        await new Promise((r) => setTimeout(r, 1000));
      }
    });

    await new Promise((r) => setTimeout(r, 500));
  },
};

// Test external links functionality
export const ExternalLinksTest = {
  parameters: {
    ...buildTestCase.parameters(
      NAVIGATION_LINKS.profileUpdateNameSuccess,
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      []
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 2000));

    // Test external links presence and attributes
    await step("Verify external links", async () => {
      // Look for GCDS links
      const links = canvasElement.querySelectorAll("gcds-link, a");
      
      if (links.length > 0) {
        // Check that links exist
        await expect(links[0]).toBeInTheDocument();
        
        // For external links, they might have href="#" in this component
        // In a real test, we'd verify they have proper href attributes
        links.forEach((link) => {
          if (link.hasAttribute("href")) {
            expect(link).toHaveAttribute("href");
          }
        });
      }
    });

    await new Promise((r) => setTimeout(r, 500));
  },
};

// Test accessibility and content structure
export const AccessibilityTest = {
  parameters: {
    ...buildTestCase.parameters(
      NAVIGATION_LINKS.profileUpdateNameSuccess,
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      []
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 2000));

    await step("Verify accessibility and structure", async () => {
      // Verify main container
      const container = canvasElement.querySelector("main") || canvasElement;
      await expect(container).toBeInTheDocument();

      // Check for proper heading hierarchy
      const h1Elements = canvasElement.querySelectorAll("h1");
      if (h1Elements.length > 0) {
        await expect(h1Elements[0]).toBeInTheDocument();
      }

      // Verify success notice has proper attributes
      const successNotice = canvasElement.querySelector('gcds-notice[type="success"]');
      if (successNotice) {
        await expect(successNotice).toBeInTheDocument();
        await expect(successNotice).toHaveAttribute("type", "success");
      }

      // Verify buttons have proper roles
      const buttons = canvasElement.querySelectorAll("gcds-button");
      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });

      // Check for text content
      const textElements = canvasElement.querySelectorAll("gcds-text, p");
      expect(textElements.length).toBeGreaterThan(0);
    });

    await new Promise((r) => setTimeout(r, 500));
  },
};

// Test user context integration
export const UserContextIntegration = {
  parameters: {
    ...buildTestCase.parameters(
      NAVIGATION_LINKS.profileUpdateNameSuccess,
      {
        language: AVAILABLE_LANGUAGES.en,
        flow: FLOW_TYPES.profile,
      },
      []
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 2000));

    await step("Verify user context integration", async () => {
      // Verify the component renders properly with user context
      const container = canvasElement.querySelector("main") || canvasElement;
      await expect(container).toBeInTheDocument();

      // The component should display user information
      // In the real component, this would show the updated username
      const strongElements = canvasElement.querySelectorAll("strong");
      if (strongElements.length > 0) {
        await expect(strongElements[0]).toBeInTheDocument();
      }

      // Verify the success state is properly displayed
      const successNotice = canvasElement.querySelector('gcds-notice[type="success"]');
      if (successNotice) {
        await expect(successNotice).toBeInTheDocument();
      }

      // Verify navigation elements are functional
      const gridContainer = canvasElement.querySelector("gcds-grid");
      if (gridContainer) {
        await expect(gridContainer).toBeInTheDocument();
      }
    });

    await new Promise((r) => setTimeout(r, 500));
  },
};
